import time
import bleach
import hashlib

sanitize_store = {}

class Sanitizer:
    def __init__(self, content: str):
        self.content = content

    def generate_key(self, session_id, user_id):
        global sanitize_store
        nonce = self.content[:128]
        timestamp = int(time.time())
        key = f"{session_id}:{user_id}:{nonce}:{timestamp}"
        hash = hashlib.sha256(key.encode()).hexdigest()

        return hash
    
    def check(self, session_id, user_id):
        global sanitize_store
        
        hash = self.generate_key(session_id, user_id)
        
        if hash in sanitize_store:
            return sanitize_store[hash]
    
        bad_chars = ['<', '>', '=', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '{', '}', '|', '\\', '/', '?', ':', ';', '.', ',', '\'', '\"', '`', '~']

        for char in bad_chars:
            if char in self.content:
                sanitize_store[hash] = True
                return True
        
        sanitize_store[hash] = False
        return False
    
    def sanitize(self):
        allowed_tags = ['p', 'strong', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'code']
        allowed_attrs = {
            '*': ['class']
        }

        return bleach.clean(self.content, tags=allowed_tags, attributes=allowed_attrs)