FROM node:24

USER node

COPY --chown=node:node --chmod=755 app /app

WORKDIR /app

RUN npm i && npm run build

USER root

RUN apt-get update && \
    apt-get install -y supervisor && \
    rm -rf /var/lib/apt/lists/*

COPY supervisord.conf /etc/supervisord.conf
COPY flag.s /root/
COPY entrypoint.sh /

RUN chmod +x /entrypoint.sh

EXPOSE 1337

CMD ["/entrypoint.sh"]
