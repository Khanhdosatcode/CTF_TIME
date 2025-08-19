FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN groupadd -r mcpuser && useradd -r -g mcpuser -m -d /home/mcpuser mcpuser

RUN chown -R mcpuser:mcpuser /app \
    && chown -R mcpuser:mcpuser /home/mcpuser \
    && chmod 777 /tmp

USER mcpuser

CMD ["bash", "-c", "echo 'Starting MCP Inspector for debugging...' && export npm_config_cache=/tmp/.npm-cache && mkdir -p /tmp/.npm-cache && npx @modelcontextprotocol/inspector@0.13.0 python server.py"]