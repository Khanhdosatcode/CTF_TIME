from flask import Blueprint, request, jsonify, session, g, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid
from decorators import login_required
from database import get_db

token_bp = Blueprint('tokens', __name__, url_prefix='/tokens')

@token_bp.route('/', methods=['GET'], strict_slashes=False)
@login_required
def get_tokens():
    user_id = session['user_id']

    db = get_db()
    cursor = db.execute(
        'SELECT id, token, created_at FROM tokens WHERE user_id = ?',
        (user_id,)
    ).fetchall()
    
    return jsonify({
        'tokens': [
            {'id': token['id'], 'token': token['token'][:10] + '...', 'created_at': token['created_at']} 
            for token in cursor
        ]
    }), 200

@token_bp.route('/', methods=['POST'], strict_slashes=False)
@login_required
def token():
    user_id = session['user_id']

    data = request.get_json()

    if not data or not data.get('token'):
        return jsonify({'error': 'token is required'}), 400

    token = data.get('token')

    db = get_db()
    cursor = db.execute(
        'SELECT * FROM tokens WHERE user_id = ?',
        (user_id,)
    ).fetchone()

    if cursor:
        db.execute(
            'UPDATE tokens SET token = ? WHERE user_id = ?',
            (token, user_id)
        )
    else:
        token_id = str(uuid.uuid4())
        db.execute(
            'INSERT INTO tokens (id, token, user_id) VALUES (?, ?, ?)',
            (token_id, token, user_id)
        )

    db.commit()

    return jsonify({'message': 'token applied'}), 201