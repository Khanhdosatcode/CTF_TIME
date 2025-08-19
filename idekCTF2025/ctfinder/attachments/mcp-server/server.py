#!/usr/bin/env python3
"""
CTFtime MCP (Model Context Protocol) Server
A Python server that provides CTFtime.org data and information for CTF events, teams, and ratings
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Union

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MCP_CONFIG = {
    'host': '0.0.0.0',
    'port': 8080,
    'ctftime_base_url': 'https://ctftime.org',
    'debug': os.getenv('MCP_DEBUG', 'false').lower() == 'true',
    'cache_duration': 180,
}

class MCPRequest(BaseModel):
    """Base MCP request model"""
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[Union[str, int]] = None

class MCPResponse(BaseModel):
    """Base MCP response model"""
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[Union[str, int]] = None

class EventData(BaseModel):
    """Event data model for notifications"""
    event: str
    data: Dict[str, Any]
    timestamp: str
    source: str = "ctftime-mcp-server"

class ToolCall(BaseModel):
    """Tool call model"""
    name: str
    arguments: Dict[str, Any]
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

app = FastAPI(
    title="CTFtime MCP Server",
    description="Model Context Protocol server for CTFtime.org data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCPServerState:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.websocket_connections: List[WebSocket] = []
        self.tools: Dict[str, callable] = {}
        
    async def broadcast_event(self, event_data: Dict[str, Any]):
        """Broadcast event to all connected WebSocket clients"""
        if self.websocket_connections:
            dead_connections = []
            for connection in self.websocket_connections:
                try:
                    await connection.send_text(json.dumps(event_data))
                except WebSocketDisconnect:
                    dead_connections.append(connection)
                except Exception as e:
                    logger.warning(f"Failed to send to WebSocket: {e}")
                    dead_connections.append(connection)
            
            for conn in dead_connections:
                if conn in self.websocket_connections:
                    self.websocket_connections.remove(conn)
    
    def is_cache_valid(self, key: str) -> bool:
        """Check if cache entry is still valid"""
        if key not in self.cache:
            return False
        
        cache_entry = self.cache[key]
        if 'timestamp' not in cache_entry:
            return False
            
        cache_time = datetime.fromisoformat(cache_entry['timestamp'])
        return (datetime.now(timezone.utc) - cache_time).seconds < MCP_CONFIG['cache_duration']
    
    def set_cache(self, key: str, data: Any):
        """Set cache entry with timestamp"""
        self.cache[key] = {
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def get_cache(self, key: str) -> Optional[Any]:
        """Get cache entry if valid"""
        if self.is_cache_valid(key):
            return self.cache[key]['data']
        return None

state = MCPServerState()

async def fetch_ctftime_data(endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
    """Fetch data from CTFtime with caching"""
    cache_key = f"{endpoint}_{str(params) if params else ''}"
    
    cached_data = state.get_cache(cache_key)
    if cached_data:
        return cached_data
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            api_urls = [
                f"{MCP_CONFIG['ctftime_base_url']}/api/v1/{endpoint}",
                f"{MCP_CONFIG['ctftime_base_url']}/api/{endpoint}",
                f"{MCP_CONFIG['ctftime_base_url']}/{endpoint}"
            ]
            
            for url in api_urls:
                try:
                    response = await client.get(url, params=params or {})
                    if response.status_code == 200:
                        data = response.json()
                        state.set_cache(cache_key, data)
                        return data
                except Exception as e:
                    logger.debug(f"Failed to fetch from {url}: {e}")
                    continue
            
            return await scrape_ctftime_data(endpoint, params)
            
    except Exception as e:
        logger.error(f"Failed to fetch CTFtime data from {endpoint}: {e}")
        return {"error": str(e), "success": False}

async def scrape_ctftime_data(endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
    """Fallback scraping method when API is not available"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if endpoint == "events":
                response = await client.get(f"{MCP_CONFIG['ctftime_base_url']}/")
                if response.status_code == 200:
                    return {
                        "events": [],
                        "message": "Scraping not fully implemented - API endpoints recommended",
                        "success": True
                    }
    except Exception as e:
        logger.error(f"Scraping failed for {endpoint}: {e}")
        
    return {
        "error": "Data not available", 
        "success": False,
        "message": "CTFtime API might be unavailable or endpoint not found"
    }

async def tool_get_upcoming_events(limit: int = 10) -> Dict[str, Any]:
    """Get upcoming CTF events from CTFtime"""
    try:
        data = await fetch_ctftime_data("events", {"limit": limit})
        
        event_data = {
            "event": "upcoming_events_fetched",
            "data": {"events_count": len(data.get("events", [])) if isinstance(data.get("events"), list) else 0},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "ctftime-mcp-server"
        }
        await state.broadcast_event(event_data)
        
        return {
            "success": True,
            "events": data.get("events", []),
            "message": f"Retrieved upcoming CTF events (limit: {limit})"
        }
        
    except Exception as e:
        logger.error(f"Failed to get upcoming events: {e}")
        return {"success": False, "error": str(e)}

async def tool_get_team_info(team_id: Optional[int] = None, team_name: Optional[str] = None) -> Dict[str, Any]:
    """Get CTF team information"""
    try:
        if team_id:
            data = await fetch_ctftime_data(f"teams/{team_id}")
        elif team_name:
            data = await fetch_ctftime_data("teams", {"name": team_name})
        else:
            return {"success": False, "error": "Either team_id or team_name is required"}
        
        return {
            "success": True,
            "team_data": data,
            "message": f"Retrieved team information for {'ID ' + str(team_id) if team_id else team_name}"
        }
        
    except Exception as e:
        logger.error(f"Failed to get team info: {e}")
        return {"success": False, "error": str(e)}

async def tool_get_team_ratings(year: Optional[int] = None, country: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Get CTF team ratings and rankings"""
    try:
        current_year = year or datetime.now().year
        params = {"year": current_year, "limit": limit}
        if country:
            params["country"] = country
            
        data = await fetch_ctftime_data("teams", params)
        
        return {
            "success": True,
            "ratings": data,
            "year": current_year,
            "country": country,
            "message": f"Retrieved top {limit} team ratings for {current_year}" + (f" (country: {country})" if country else "")
        }
        
    except Exception as e:
        logger.error(f"Failed to get team ratings: {e}")
        return {"success": False, "error": str(e)}

async def tool_get_event_details(event_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific CTF event"""
    try:
        data = await fetch_ctftime_data(f"events/{event_id}")
        
        return {
            "success": True,
            "event": data,
            "message": f"Retrieved details for event ID {event_id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to get event details: {e}")
        return {"success": False, "error": str(e)}

async def tool_compare_teams(team_ids: List[int]) -> Dict[str, Any]:
    """Compare multiple CTF teams"""
    try:
        if len(team_ids) < 2:
            return {"success": False, "error": "At least 2 teams required for comparison"}
        
        teams_data = []
        for team_id in team_ids:
            team_data = await fetch_ctftime_data(f"teams/{team_id}")
            teams_data.append(team_data)
        
        return {
            "success": True,
            "comparison": teams_data,
            "message": f"Compared {len(team_ids)} teams"
        }
        
    except Exception as e:
        logger.error(f"Failed to compare teams: {e}")
        return {"success": False, "error": str(e)}

async def tool_search_events(query: str, format_type: Optional[str] = None, year: Optional[int] = None) -> Dict[str, Any]:
    """Search CTF events by name or criteria"""
    try:
        params = {"q": query}
        if format_type:
            params["format"] = format_type
        if year:
            params["year"] = year
            
        data = await fetch_ctftime_data("events/search", params)
        
        return {
            "success": True,
            "events": data.get("events", []),
            "query": query,
            "message": f"Search results for '{query}'"
        }
        
    except Exception as e:
        logger.error(f"Failed to search events: {e}")
        return {"success": False, "error": str(e)}

state.tools = {
    "get_upcoming_events": tool_get_upcoming_events,
    "get_team_info": tool_get_team_info,
    "get_team_ratings": tool_get_team_ratings,
    "get_event_details": tool_get_event_details,
    "compare_teams": tool_compare_teams,
    "search_events": tool_search_events,
}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ctftime-mcp-server",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tools_available": list(state.tools.keys()),
        "cache_entries": len(state.cache),
        "websocket_connections": len(state.websocket_connections)
    }

@app.get("/tools")
async def list_tools():
    """List available tools"""
    return {
        "tools": [
            {
                "name": "get_upcoming_events",
                "description": "Get upcoming CTF events from CTFtime",
                "parameters": {
                    "limit": {"type": "integer", "required": False, "default": 10, "description": "Number of events to retrieve"}
                }
            },
            {
                "name": "get_team_info",
                "description": "Get information about a specific CTF team",
                "parameters": {
                    "team_id": {"type": "integer", "required": False, "description": "Team ID"},
                    "team_name": {"type": "string", "required": False, "description": "Team name"}
                }
            },
            {
                "name": "get_team_ratings",
                "description": "Get CTF team ratings and rankings",
                "parameters": {
                    "year": {"type": "integer", "required": False, "description": "Year for ratings"},
                    "country": {"type": "string", "required": False, "description": "Filter by country"},
                    "limit": {"type": "integer", "required": False, "default": 50, "description": "Number of teams to retrieve"}
                }
            },
            {
                "name": "get_event_details",
                "description": "Get detailed information about a specific CTF event",
                "parameters": {
                    "event_id": {"type": "integer", "required": True, "description": "Event ID"}
                }
            },
            {
                "name": "compare_teams",
                "description": "Compare multiple CTF teams",
                "parameters": {
                    "team_ids": {"type": "array", "items": {"type": "integer"}, "required": True, "description": "List of team IDs to compare"}
                }
            },
            {
                "name": "search_events",
                "description": "Search CTF events by name or criteria",
                "parameters": {
                    "query": {"type": "string", "required": True, "description": "Search query"},
                    "format_type": {"type": "string", "required": False, "description": "Event format (jeopardy, attack-defence, etc.)"},
                    "year": {"type": "integer", "required": False, "description": "Year filter"}
                }
            }
        ]
    }

@app.post("/call-tool")
async def call_tool(tool_call: ToolCall):
    """Call a specific tool"""
    tool_name = tool_call.name
    
    if tool_name not in state.tools:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
    
    try:
        result = await state.tools[tool_name](**tool_call.arguments)
        return {
            "id": tool_call.id,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Tool '{tool_name}' failed: {e}")
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")

@app.post("/events")
async def receive_event(event_data: EventData):
    """Receive events from other services"""
    event_dict = event_data.dict()
    await state.broadcast_event(event_dict)
    
    logger.info(f"Received event: {event_data.event} from {event_data.source}")
    return {"status": "received"}

@app.get("/cache/status")
async def cache_status():
    """Get cache status and statistics"""
    valid_entries = sum(1 for key in state.cache.keys() if state.is_cache_valid(key))
    return {
        "total_entries": len(state.cache),
        "valid_entries": valid_entries,
        "cache_duration_seconds": MCP_CONFIG['cache_duration'],
        "entries": list(state.cache.keys())
    }

@app.delete("/cache")
async def clear_cache():
    """Clear all cache entries"""
    cleared_count = len(state.cache)
    state.cache.clear()
    return {"message": f"Cleared {cleared_count} cache entries"}

@app.post("/mcp")
async def mcp_endpoint(request: MCPRequest):
    """Main MCP protocol endpoint"""
    try:
        method = request.method
        params = request.params or {}
        
        if method == "tools/list":
            tools_response = await list_tools()
            return MCPResponse(
                result=tools_response,
                id=request.id
            )
        
        elif method == "tools/call":
            tool_name = params.get("name")
            tool_arguments = params.get("arguments", {})
            
            if tool_name not in state.tools:
                return MCPResponse(
                    error={"code": -32602, "message": f"Tool '{tool_name}' not found"},
                    id=request.id
                )
            
            result = await state.tools[tool_name](**tool_arguments)
            return MCPResponse(
                result={"content": [{"type": "text", "text": json.dumps(result, indent=2)}]},
                id=request.id
            )
        
        else:
            return MCPResponse(
                error={"code": -32601, "message": f"Method '{method}' not found"},
                id=request.id
            )
            
    except Exception as e:
        logger.error(f"MCP request failed: {e}")
        return MCPResponse(
            error={"code": -32603, "message": f"Internal error: {str(e)}"},
            id=request.id
        )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time event streaming"""
    await websocket.accept()
    state.websocket_connections.append(websocket)
    
    try:
        await websocket.send_text(json.dumps({
            "event": "connection_established",
            "data": {"message": "Connected to CTFtime MCP Server"},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in state.websocket_connections:
            state.websocket_connections.remove(websocket)

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("CTFtime MCP Server starting up...")
    logger.info(f"CTFtime Base URL: {MCP_CONFIG['ctftime_base_url']}")
    logger.info(f"Available tools: {', '.join(state.tools.keys())}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("CTFtime MCP Server shutting down...")

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host=MCP_CONFIG['host'],
        port=MCP_CONFIG['port'],
        reload=MCP_CONFIG['debug'],
        log_level="info"
    ) 