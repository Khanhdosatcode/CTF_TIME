import os
from werkzeug.utils import secure_filename
from flask import current_app
from urllib.parse import quote
from libs.safe_eval import safe_eval
import shutil
from werkzeug.utils import secure_filename
from PIL import Image
import imghdr

MAX_FILE_SIZE = 5 * 1024 * 1024

def allowed_file(filename):
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    return ext in current_app.config['ALLOWED_EXTENSIONS']

def is_image(file_path):
    try:
        with Image.open(file_path) as img:
            img.verify()
        return imghdr.what(file_path) in current_app.config['ALLOWED_EXTENSIONS']
    except Exception:
        return False

def save_uploaded_file(file):
    if not file:
        return None
    
    filename = secure_filename(file.filename)
    upload_folder = current_app.config['TEMP_UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    temp_path = os.path.join(upload_folder, filename)
    file.save(temp_path)

    if os.path.getsize(temp_path) > MAX_FILE_SIZE:
        os.remove(temp_path)
        return None

    if not allowed_file(filename):
        os.remove(temp_path)
        return None

    if not is_image(temp_path):
        os.remove(temp_path)
        return None

    ext = os.path.splitext(filename)[1].lower()
    new_filename = os.urandom(16).hex() + ext
    dest_folder = os.path.join(current_app.root_path, 'static', 'images')
    os.makedirs(dest_folder, exist_ok=True)

    dest_path = os.path.join(dest_folder, new_filename)
    shutil.move(temp_path, dest_path)

    return os.path.join('images', new_filename)

def urlencode(value):
    return quote(str(value))

def render_email_template(template_str):
    try:
        template = safe_eval(template_str)
        return template
    except Exception as e:
        current_app.logger.error(f"Template rendering error: {e}")
        return None