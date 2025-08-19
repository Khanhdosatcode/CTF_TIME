from flask import Blueprint, request, jsonify, session as flask_session, g, render_template, Response, current_app, redirect, url_for
import json
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid
import time
import threading
import requests
from decorators import login_required, token_required
from database import get_db
from sessions.sanitizer import Sanitizer
from redis_config import get_redis, get_pubsub_redis
from sessions.stream import stream_claude_response

session_bp = Blueprint('sessions', __name__, url_prefix='/sessions')

@session_bp.route('/', methods=['GET'], strict_slashes=False)
@login_required
def get_sessions():
    user_id = flask_session['user_id']
    username = flask_session['username']

    db = get_db()
    cursor = db.execute(
        'SELECT id, title FROM sessions WHERE user_id = ?',
        (user_id,)
    ).fetchall()

    return jsonify({
        'user': {
            'username': username,
            'user_id': user_id
        },
        'sessions': [
            {'id': session['id'], 'title': session['title']} for session in cursor
        ]
    }), 200

@session_bp.route('/<session_id>', methods=['GET'])
@login_required
def session_page(session_id):
    user_id = flask_session['user_id']
    username = flask_session['username']
    is_admin = flask_session['is_admin']

    error_message = None
    report_id = None

    messages_json = []

    if is_admin:
        user_id = request.args.get('user_id', type=str)
        report_id = request.args.get('report_id', type=str)

    redis = get_redis()
    report = redis.get(f"session:{session_id}:{user_id}:report")

    if report:
        error_message = json.loads(report)
    
    db = get_db()
    session_data = db.execute(
        'SELECT id, title FROM sessions WHERE user_id = ? AND id = ?',
        (user_id, session_id)
    ).fetchone()
    
    if not session_data:
        return redirect(url_for('index'))
    
    messages = db.execute(
        'SELECT id, role, content, token_count, parent_id, sequence_id FROM messages WHERE session_id = ? ORDER BY sequence_id DESC LIMIT 10',
        (session_id,)
    ).fetchall()

    session_json = {
        'id': session_data['id'],
        'title': session_data['title']
    }

    if error_message:
        messages_json = [
            {
                'id': error_message['message_id'],
                'role': 'error-assistant',
                'content': error_message['message'], 
                'token_count': 0,
                'parent_id': error_message['meta']['message_id'],
                'sequence_id': messages[-1]['sequence_id'] if messages else 0
            },
            {
                'id': error_message['meta']['message_id'],
                'role': error_message['meta']['role'], 
                'content': error_message['meta']['content'],
                'token_count': 0,
                'parent_id': None,
                'sequence_id': messages[-1]['sequence_id'] if messages else 0
            }
        ]
    
    messages_json.extend([
        {
            'id': message['id'], 
            'role': message['role'], 
            'content': message['content'], 
            'token_count': message['token_count'], 
            'parent_id': message['parent_id'], 
            'sequence_id': message['sequence_id']
        } for message in messages
    ])
    
    user_json = {
        'username': username,
        'user_id': user_id,
        'is_admin': is_admin
    }
    
    return render_template('session.html', 
                         session_data=session_json, 
                         messages_data=messages_json,
                         user_data=user_json,
                         report_id=report_id if report_id else None)

@session_bp.route('/<session_id>/messages', methods=['GET'])
@login_required
@token_required
def get_messages(session_id):
    user_id = flask_session['user_id']
    
    last_sequence_id = request.args.get('last_sequence_id', 0, type=int)
    limit = request.args.get('limit', 10, type=int)
    reverse = request.args.get('reverse', 'false').lower() == 'true'
    
    limit = min(max(limit, 1), 50)
    
    db = get_db()
    
    if reverse:
        messages = db.execute(
            '''
            SELECT id, role, content, token_count, parent_id, sequence_id 
            FROM messages 
            WHERE session_id = ? AND sequence_id < ? 
            ORDER BY sequence_id DESC 
            LIMIT ?
            ''',
            (session_id, last_sequence_id, limit)
        ).fetchall()
    else:
        messages = db.execute(
            '''
            SELECT id, role, content, token_count, parent_id, sequence_id 
            FROM messages 
            WHERE session_id = ? AND sequence_id > ? 
            ORDER BY sequence_id ASC 
            LIMIT ?
            ''',
            (session_id, last_sequence_id, limit)
        ).fetchall()
    
    return jsonify({
        'messages': [
            {
                'id': message['id'], 
                'role': message['role'], 
                'content': message['content'], 
                'token_count': message['token_count'], 
                'parent_id': message['parent_id'], 
                'sequence_id': message['sequence_id']
            } for message in messages
        ],
    }), 200

@session_bp.route('/<session_id>/stream', methods=['GET'])
@login_required
@token_required
def message_stream(session_id):
    user_id = flask_session['user_id']

    channel = request.args.get('channel', type=str)

    if not channel or not channel.startswith("session:"):
        return jsonify({'error': 'Invalid stream channel'}), 400

    channel_parts = channel.split(':')
    if len(channel_parts) < 5 or channel_parts[1] != session_id or channel_parts[2] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    def event_stream():
        redis_client = get_pubsub_redis()
        pubsub = redis_client.pubsub()
        
        try:
            pubsub.subscribe(channel)
            
            yield f"data: {json.dumps({'event': 'connected'})}\n\n"

            while True:
                try:
                    message = pubsub.get_message(timeout=1.0)
                    
                    if message is None:
                        continue

                    if message['type'] == 'message':
                        try:
                            raw_data = message['data']

                            if isinstance(raw_data, bytes):
                                data = raw_data.decode('utf-8')
                            else:
                                data = str(raw_data)

                            try:
                                json_data = json.loads(data)
                                
                                if json_data.get('event') == 'error':
                                    yield f"event: error\ndata: {data}\n\n"
                                    break
                                elif json_data.get('event') == 'complete':
                                    yield f"data: {data}\n\n"
                                    break
                            except json.JSONDecodeError:
                                continue
            
                            yield f"data: {data}\n\n"
                            
                        except Exception as e:
                            error_data = json.dumps({
                                'event': 'error', 
                                'message': f'Stream processing error'
                            })
                            yield f"data: {error_data}\n\n"
                            break
                            
                except Exception as e:
                    error_data = json.dumps({
                        'event': 'error', 
                        'message': f'Stream timeout error: {str(e)}'
                    })
                    yield f"data: {error_data}\n\n"
                    break
            
        except Exception as e:
            error_data = json.dumps({
                'event': 'error', 
                'message': f'Stream connection error: {str(e)}'
            })
            yield f"data: {error_data}\n\n"
        finally:
            try:
                pubsub.unsubscribe(channel)
                pubsub.close()
            except:
                pass
    
    return Response(
        event_stream(), 
        mimetype='text/event-stream', 
        headers={ 
            'Cache-Control': 'no-cache', 
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'Keep-Alive': 'timeout=30, max=100'
        }
    ) 

@session_bp.route('/<session_id>/report', methods=['GET'])
@login_required
@token_required
def get_report(session_id):
    user_id = flask_session['user_id']

    redis = get_redis()
    report = redis.get(f"session:{session_id}:{user_id}:report")

    if not report:
        return jsonify({'error': 'No report found'}), 404

    res = requests.get(f"http://bot:5010/?session_id={session_id}&user_id={user_id}")

    if res.json().get('message') != "Bot visited the URL":
        return jsonify({'error': 'Failed to get report'}), 400
    
    redis.delete(f"session:{session_id}:{user_id}:report")

    return jsonify({'message': 'Report sent'}), 200

@session_bp.route('/', methods=['POST'], strict_slashes=False)
@login_required
@token_required
def create_session():
    user_id = flask_session['user_id']

    db = get_db()
    cursor = db.execute(
        'SELECT COUNT(id) FROM sessions WHERE user_id = ?',
        (user_id,)
    ).fetchone()

    if cursor[0] >= 15:
        return jsonify({'error': 'max session limit reached'}), 400

    cursor = db.execute(
        'SELECT id FROM sessions WHERE user_id = ? AND title = "New Session"',
        (user_id,)
    ).fetchone()

    if cursor:
        return jsonify({
            'error': 'New Session already exists, please delete it first'
        }), 400
    
    session_id = str(uuid.uuid4())
    
    db.execute(
        'INSERT INTO sessions (id, user_id) VALUES (?, ?)',
        (session_id, user_id)
    )
    db.commit()

    return jsonify({
        'session_id': session_id
    }), 201

@session_bp.route('/<session_id>/messages', methods=['POST'])
@login_required
@token_required
def create_message(session_id):
    user_id = flask_session['user_id']

    data = request.get_json()

    if not data or not data.get('content'):
        return jsonify({'error': 'content is required'}), 400

    redis = get_redis()

    if redis.get(f"session:{session_id}:{user_id}:report"):
        return jsonify({'error': 'Report is not finished yet'}), 400

    content = data.get('content')

    sanitizer = Sanitizer(content)

    if sanitizer.check(session_id, user_id):
        content = sanitizer.sanitize()
    
    timestamp = int(time.time())
    message_id = str(uuid.uuid4())

    meta_cache_key = f'session:{session_id}:{user_id}:{timestamp}:meta'
    stream_channel = f'session:{session_id}:{user_id}:{timestamp}:stream'

    db = get_db()
    cursor = db.execute(
        'SELECT id FROM messages WHERE session_id = ?',
        (session_id,)
    ).fetchone()
    
    if not cursor:
        db.execute(
            'UPDATE sessions SET title = ? WHERE id = ?',
            (content[:20], session_id)
        )
        db.commit()

    redis = get_redis()
    redis.set(meta_cache_key, json.dumps({
        'message_id': message_id,
        'role': 'user',
        'content': content,
        'token_count': 0,
        'parent_id': None,
        'timestamp': timestamp
    }), ex = 60 * 5)

    thread = threading.Thread(
        target=stream_claude_response,
        args=(current_app._get_current_object(), session_id, user_id, content, message_id, stream_channel)
    )

    thread.daemon = True
    thread.start()
    
    return jsonify({
        'message_id': message_id,
        'status': 'processing',
        'stream_channel': stream_channel,
        'content': content
    }), 202

@session_bp.route('/<session_id>', methods=['DELETE'])
@login_required
@token_required
def delete_session(session_id):
    user_id = flask_session['user_id']

    db = get_db()
    db.execute(
        'DELETE FROM sessions WHERE user_id = ? AND id = ?',
        (user_id, session_id)
    )
    db.commit()

    return jsonify({'message': 'session deleted'}), 200