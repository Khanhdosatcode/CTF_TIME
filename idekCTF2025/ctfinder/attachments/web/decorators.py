from functools import wraps
from flask import session, request, jsonify, redirect, url_for
from tokens.utils import get_token_by_user_id

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json or 'application/json' in request.headers.get('Accept', ''):
                return jsonify({'error': 'login required'}), 401
            else:
                return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session['user_id']
        token = get_token_by_user_id(user_id)
        if not token:
            return jsonify({'error': 'token required'}), 401
        return f(*args, **kwargs)
    return decorated_function