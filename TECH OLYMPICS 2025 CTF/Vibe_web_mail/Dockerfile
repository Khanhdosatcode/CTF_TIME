FROM python:3.11-slim

RUN apt-get update && apt-get install -y gcc sqlite3 && apt-get clean

RUN useradd -m -s /bin/bash webuser

WORKDIR /app
RUN chown -R webuser:webuser /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP=app:create_app
ENV FLASK_ENV=development
ENV DATABASE_URL=sqlite:////app/site.db
ENV TEMP_UPLOAD_FOLDER=/app/temp_uploads/random_string_in_here
ENV FLAG=FLAG{ThisIsASampleFlagForTesting123}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/. .

EXPOSE 5000
RUN mkdir -p /app/static/images && chown -R webuser:webuser /app/static

USER webuser

CMD ["flask", "run", "--host", "0.0.0.0"]