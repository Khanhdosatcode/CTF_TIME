FROM python:3.11-slim

RUN pip install --no-cache-dir flask==3.1.1

WORKDIR /app

COPY app .

RUN chown -R nobody:nogroup /app

USER nobody

EXPOSE 5000

CMD ["python", "app.py"]