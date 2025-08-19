from flask import Flask, render_template, g, session, request, jsonify, redirect, url_for
import sqlite3
import os
import secrets
from auth.routes import auth_bp
from sessions.routes import session_bp
from tokens.routes import token_bp
from database import get_db, init_db
from admins.routes import admin_bp

app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'TBD')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

DATABASE = '/app/data/ctfinder.db'

@app.before_request
def generate_nonce():
    g.csp_nonce = secrets.token_urlsafe(16)

@app.after_request
def add_security_headers(response):
    nonce = getattr(g, 'csp_nonce', '')
    csp_policy = (
        "default-src 'self'; "
        f"script-src 'self' 'nonce-{nonce}' https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; "
        "font-src 'self' https://cdnjs.cloudflare.com; "
        "img-src 'self'; "
        "connect-src 'self'; "
        "media-src 'self'; "
        "worker-src 'self'; "
        "child-src 'none'; "
        "frame-src 'none'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
    )

    response.headers['Content-Security-Policy'] = csp_policy
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    return response

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

app.register_blueprint(auth_bp)
app.register_blueprint(session_bp)
app.register_blueprint(token_bp)
app.register_blueprint(admin_bp)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        return render_template('index.html')
    elif request.method == 'POST':
        return jsonify({'message': 'POST method not allowed'}), 405

if __name__ == '__main__':
    init_db(app)
    app.run(host='0.0.0.0', port=1337, debug=False) 