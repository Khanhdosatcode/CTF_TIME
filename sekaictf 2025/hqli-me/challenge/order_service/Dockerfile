FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . /app

RUN apt-get update && \
    apt-get install -y maven && \
    mvn clean package assembly:single

USER nobody

CMD ["java", "-jar", "target/hn-1.0-SNAPSHOT-jar-with-dependencies.jar"]
