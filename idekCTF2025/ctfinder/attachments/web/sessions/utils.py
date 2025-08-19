from database import get_db

def get_conversation_history(session_id, user_id):
    db = get_db()

    cursor = db.execute(
        'SELECT * FROM messages WHERE session_id = ? AND user_id = ? ORDER BY sequence_id DESC LIMIT 10',
        (session_id, user_id)
    )

    conversation_history = cursor.fetchall()
    conversation_history.reverse()

    return [
        {
            'role': message['role'],
            'content': message['content']
        } for message in conversation_history
    ]

def save_message_to_db(session_id, user_id, message_id, role, content, parent_message_id, token_count):
    db = get_db()

    cursor = db.execute(
        'SELECT sequence_id FROM messages WHERE session_id = ? ORDER BY sequence_id DESC LIMIT 1',
        (session_id,)
    ).fetchone()

    if cursor:
        sequence_id = cursor['sequence_id'] + 1
    else:
        sequence_id = 1

    db.execute(
        'INSERT INTO messages (id, session_id, user_id, role, content, token_count, parent_id, sequence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (message_id, session_id, user_id, role, content, token_count, parent_message_id, sequence_id)
    )
    db.commit()