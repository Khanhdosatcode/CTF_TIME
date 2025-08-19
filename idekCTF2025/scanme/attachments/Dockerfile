FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV GO_VERSION=1.21.5
RUN wget https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz

ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=/go
ENV PATH=$PATH:$GOPATH/bin

RUN groupadd -r nuclei && useradd -m -g nuclei nuclei

WORKDIR /home/nuclei

COPY app.py .
COPY .env .
COPY index.html .
COPY requirements.txt .
COPY flag.txt /

RUN pip install --no-cache-dir -r requirements.txt

RUN go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

RUN /go/bin/nuclei -update-templates

USER nuclei

EXPOSE 1337

CMD ["python", "app.py"]
