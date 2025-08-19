import requests
import json
import uuid
import sqlite3
import html

from redis_config import get_redis
from database import get_db
from tokens.utils import get_token_by_user_id
from sessions.utils import get_conversation_history, save_message_to_db
from sessions.sanitizer import Sanitizer

def stream_claude_response(app, session_id, user_id, content, parent_message_id, stream_channel):
    with app.app_context():
        conversation_history = get_conversation_history(session_id, user_id)
        api_key = get_token_by_user_id(user_id)

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        request_body = {
            "model": "claude-3-5-haiku-latest",
            "max_tokens": 4000,
            "messages": conversation_history + [{"role": "user", "content": content}],
            "stream": True
        }
        
        redis = get_redis()
        assistant_message_id = str(uuid.uuid4())

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=request_body,
            stream=True
        )
        
        if not response.ok:
            error_message = f"Claude API Error: HTTP {response.status_code}"

            try:
                error_data = response.json()

                if 'error' in error_data:
                    error_message += f" - {error_data['error']['message']}"
            except:
                pass

            redis.publish(stream_channel, json.dumps({
                "event": "error",
                "message": "Error streaming response",
                "status_code": 500
            }))
            
            redis.set(f"session:{session_id}:{user_id}:report", json.dumps({
                "event": "error",
                "meta": json.loads(redis.get(stream_channel.replace('stream', 'meta'))),
                "message_id": assistant_message_id,
                "message": error_message
            }))

            redis.delete(stream_channel.replace('stream', 'meta'))
            redis.delete(stream_channel)

            return
        
        full_content = ""
        token_count = 0
        
        redis.publish(stream_channel, json.dumps({
            "event": "start",
            "message_id": assistant_message_id,
            "parent_id": parent_message_id
        }))
    
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith('data: '):
                    line_data = json.loads(line_text[6:])
                    
                    if 'type' in line_data and line_data['type'] == 'content_block_delta':
                        content_delta = line_data['delta']['text']
                        content_delta = html.escape(content_delta)
                        full_content += content_delta
                        token_count += 1

                        redis.publish(stream_channel, json.dumps({
                            "event": "chunk",
                            "message_id": assistant_message_id,
                            "content": content_delta
                        }))

        redis.publish(stream_channel, json.dumps({
            "event": "complete",
            "message_id": assistant_message_id,
            "content": full_content
        }))

        sanitizer = Sanitizer(full_content)
    
        if sanitizer.check(session_id, user_id):
            full_content = sanitizer.sanitize()

        meta_data = json.loads(redis.get(stream_channel.replace('stream', 'meta')))

        save_message_to_db(session_id, user_id, parent_message_id, 'user', meta_data['content'], None, 0)
        save_message_to_db(session_id, user_id, assistant_message_id, 'assistant', full_content, parent_message_id, token_count)

        redis.delete(stream_channel.replace('stream', 'meta'))
        redis.delete(stream_channel)