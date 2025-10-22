FROM python:3.12-alpine
WORKDIR /app
COPY . /app/
RUN apk add --no-cache gcc musl-dev
RUN gcc -o /readflag readflag.c
RUN mv flag /flag && rm readflag.c
RUN chown root:root /flag
RUN chmod 400 /flag
RUN chown root:root /readflag
RUN chmod 4755 /readflag

RUN adduser -D ctf
RUN chown -R ctf:ctf /app
USER ctf

RUN pip install --no-cache-dir -r requirements.txt
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production
EXPOSE 5000
CMD ["python3", "app.py"]