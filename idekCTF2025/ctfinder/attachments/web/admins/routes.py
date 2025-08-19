from flask import Blueprint, request, jsonify, session as flask_session, g, render_template, Response, current_app, redirect, url_for
from redis_config import get_redis
from database import get_db
from decorators import login_required, token_required
import hashlib
import uuid

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/sessions/<session_id>/report', methods=['GET'])
@login_required
def get_report_log(session_id):
    user_id = flask_session['user_id']
    is_admin = flask_session['is_admin']

    db = get_db()
    report_logs = db.execute('SELECT * FROM report_logs WHERE session_id = ?', (session_id,)).fetchall()

    if not report_logs:
        return jsonify({'error': 'No report logs found'}), 404

    report_logs_json = []

    for report_log in report_logs:
        if report_log['user_id'] == user_id or is_admin:
            report_logs_json.append({
                'id': report_log['id'],
                'user_id': report_log['user_id'],
                'session_id': report_log['session_id'],
                'message_id': report_log['message_id'],
                'report_message': report_log['report_message'] if is_admin else "Cannot view report message"
            })

    return jsonify({'report_logs': report_logs_json}), 200

@admin_bp.route('/sessions/<session_id>/report', methods=['POST'])
@login_required
def save_report_log(session_id):
    user_id = flask_session['user_id']
    is_admin = flask_session['is_admin']

    if not is_admin:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()

    report_message = data.get('report_message')
    reporter_id = data.get('reporter_id')

    if not report_message or not reporter_id:
        return jsonify({'error': 'report_message and reporter_id are required'}), 400

    report_message = report_message.replace('\n', '').replace('\r', '').replace('\t', '').replace('<', '&lt;').replace('>', '&gt;')
    message_id = hashlib.sha256(report_message.encode()).hexdigest()

    db = get_db()
    existing_report = db.execute('SELECT id FROM report_logs WHERE report_message = ? AND user_id = ?', (message_id, reporter_id)).fetchone()

    if existing_report:
        return jsonify({'error': 'Report already exists'}), 400
    
    db.execute('INSERT INTO report_logs (id, user_id, admin_id, session_id, message_id, report_message) VALUES (?, ?, ?, ?, ?, ?)', (str(uuid.uuid4()), reporter_id, user_id, session_id, message_id, report_message))
    db.commit()

    return jsonify({'message': 'Report saved'}), 200
    