# Use the official Deno image
FROM denoland/deno:latest

# Set the working directory
WORKDIR /app

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && \
    mkdir -p /app/static && \
    chown -R deno:deno /app

# Copy server.ts first for dependency caching
COPY --chown=deno:deno src/server.ts /app/

# Cache dependencies as root user (has better network access)
RUN deno cache server.ts

# Copy remaining application files
COPY --chown=deno:deno src/index.html /app/
COPY --chown=deno:deno src/static/ /app/static/
COPY --chown=deno:deno src/uploads/ /app/uploads/

# Create uploads directory for runtime
VOLUME ["/app/uploads"]

# Expose the port
EXPOSE 1337

# Switch to deno user for security
USER deno

# Run the application (dependencies are already cached)
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "server.ts"]
