
# QnQsec – portal (Easy Mode)

Chain: **Unicode ligature → Admin gate → jwt ->Jinja2 SSTI → flag file read**

## Goal
Read the flag in `/app/secret/flag.txt`. (Rendered as `QnQsec{<32-hex>}`.)

## Hints
- Sign-up stores `lower(?)` (Unicode-unsafe).
- Login sets `session['user'] = username.title()`.
- `/account` shows admin link only if user equals `"Flag"`.
- `/admin` renders a template string you control (Jinja2 SSTI).

### Example SSTI (once you reach /admin)
```jinja2
{{ request.application.__globals__.__builtins__.__import__('os').popen('cat /app/secret/flag.txt').read() }}
```

## Run (local)
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
# http://127.0.0.1:5000/
```

## Docker
```bash
docker build -t qnqsec .
docker run -d -p 5000:5000 --name qnqsec qnqsec
```
