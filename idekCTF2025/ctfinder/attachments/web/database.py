from flask import g
from werkzeug.security import generate_password_hash
import sqlite3
import uuid
import os

DATABASE = '/app/data/ctfinder.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def close_db(error):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db(app):
    """Initialize the database with required tables"""
    import os
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS tokens (
                id TEXT PRIMARY KEY NOT NULL,
                token TEXT NOT NULL UNIQUE,
                user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT DEFAULT 'New Session',
                user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY NOT NULL,
                session_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
                content TEXT NOT NULL,
                token_count INTEGER NOT NULL,
                parent_id TEXT,
                sequence_id INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (parent_id) REFERENCES messages (id)
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS report_logs (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                admin_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                report_message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (session_id) REFERENCES sessions (id),
                FOREIGN KEY (admin_id) REFERENCES users (id)
            )
        ''')
        db.commit()

        db.execute("INSERT OR IGNORE INTO users (id, username, password, is_admin) VALUES (?, ?, ?, ?)", (
            str(uuid.uuid4()), 
            os.getenv("ADMIN_USERNAME"), 
            generate_password_hash(os.getenv("ADMIN_PASSWORD")), 
            True
        ))
        db.commit()