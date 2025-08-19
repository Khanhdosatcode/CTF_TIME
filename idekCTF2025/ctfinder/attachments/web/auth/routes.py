from flask import Blueprint, request, jsonify, session, g, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid
import os
from decorators import login_required
from database import get_db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['GET'])
def register_page():
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'username and password are required'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        db = get_db()
        existing_user = db.execute(
            'SELECT id FROM users WHERE username = ?', (username,)
        ).fetchone()
        
        if existing_user:
            return jsonify({'error': 'username already exists'}), 409
        
        password_hash = generate_password_hash(password)
        user_id = str(uuid.uuid4())
        
        db.execute(
            'INSERT INTO users (id, username, password, is_admin) VALUES (?, ?, ?, ?)',
            (user_id, username, password_hash, False)
        )
        db.commit()
        
        return jsonify({
            'message': 'registration successful',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'username and password are required'}), 400
        
        username = data.get('username')
        password = data.get('password')

        db = get_db()
        user = db.execute(
            'SELECT id, username, password, is_admin, created_at FROM users WHERE username = ?',
            (username,)
        ).fetchone()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'invalid username or password'}), 401
        
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['is_admin'] = user['is_admin']
        
        return jsonify({
            'message': 'login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'is_admin': user['is_admin'],
                'created_at': user['created_at']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'login failed'}), 500

@auth_bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    try:
        session.clear()
        return jsonify({'message': 'logout successful'}), 200
    except Exception as e:
        return jsonify({'error': f'logout failed'}), 500
