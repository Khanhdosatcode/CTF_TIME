import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.urandom(64).hex()
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///site.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMP_UPLOAD_FOLDER = os.getenv('TEMP_UPLOAD_FOLDER', 'temp_uploads')
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024