FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV JAVA_HOME=/opt/java
ENV CATALINA_HOME=/opt/tomcat9
ENV PATH=$JAVA_HOME/bin:$CATALINA_HOME/bin:$PATH

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    wget curl ca-certificates tar unzip procps \
 && rm -rf /var/lib/apt/lists/*

RUN cd /tmp \
 && wget -qO temurin8.tar.gz "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u462-b08/OpenJDK8U-jdk_x64_linux_hotspot_8u462b08.tar.gz" \
 && tar -xzf temurin8.tar.gz -C /opt \
 && JDIR=$(tar -tzf temurin8.tar.gz | head -1 | cut -f1 -d"/") \
 && ln -s /opt/$JDIR /opt/java \
 && rm -f temurin8.tar.gz

RUN cd /tmp \
 && wget -qO tomcat.tar.gz "https://archive.apache.org/dist/tomcat/tomcat-9/v9.0.58/bin/apache-tomcat-9.0.58.tar.gz" \
 && tar -xzf tomcat.tar.gz -C /opt \
 && mv /opt/apache-tomcat-9.0.58 /opt/tomcat9 \
 && rm -f tomcat.tar.gz

RUN useradd -M -d /opt/tomcat9 -s /usr/sbin/nologin tomcat \
 && chown -R tomcat:tomcat /opt/tomcat9 /opt/java

COPY app/ /tmp/app/
COPY lib/ /tmp/lib/
COPY web.xml /tmp/web.xml
RUN mkdir /safebox
COPY secretformula.txt /safebox/secretformula.txt
COPY secretformula_for_plankton.txt /safebox/secretformula_for_plankton.txt
RUN chmod -R 555 /safebox
RUN rm /opt/tomcat9/webapps/ROOT/index.jsp

RUN mkdir -p /opt/tomcat9/webapps/ROOT/WEB-INF/classes \
 && mkdir -p /opt/tomcat9/webapps/ROOT/WEB-INF/lib \
 \
 && if ls /tmp/lib/*.jar 1>/dev/null 2>&1; then \
      cp /tmp/lib/*.jar /opt/tomcat9/webapps/ROOT/WEB-INF/lib/; \
    fi \
 \
 && if ls /tmp/app/*.java 1>/dev/null 2>&1; then \
      javac -cp /opt/tomcat9/lib/servlet-api.jar:. \
            -d /opt/tomcat9/webapps/ROOT/WEB-INF/classes \
            /tmp/app/*.java; \
    fi \
 \
 && if [ -f /tmp/web.xml ]; then \
      cp /tmp/web.xml /opt/tomcat9/webapps/ROOT/WEB-INF/web.xml; \
    fi \
 \
 && rm -rf /tmp/app /tmp/lib /tmp/web.xml \
 && chown -R tomcat:tomcat /opt/tomcat9/webapps/ROOT

RUN apt-get update && \
    apt-get install -y iputils-ping iproute2 net-tools curl && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8080

USER tomcat
WORKDIR /opt/tomcat9

CMD ["catalina.sh", "run"]
