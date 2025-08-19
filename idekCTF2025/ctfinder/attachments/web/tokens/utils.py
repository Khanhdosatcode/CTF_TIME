from database import get_db

def get_token_by_user_id(user_id):
    db = get_db()
    
    cursor = db.execute(
        'SELECT token FROM tokens WHERE user_id = ?',
        (user_id,)
    ).fetchone()

    return cursor['token'] if cursor else None