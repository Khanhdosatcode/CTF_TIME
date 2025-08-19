FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . /app

RUN apt-get update && \
    apt-get install -y maven gcc && \
    mvn clean package assembly:single

COPY flag.s /root/
COPY entrypoint.sh /
    
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]