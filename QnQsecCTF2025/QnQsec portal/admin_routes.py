from flask import Blueprint, request, render_template, render_template_string, session, current_app, abort
import jwt
from datetime import datetime,timezone,timedelta

admin_bp = Blueprint('admin', __name__, template_folder='templates')
def generate_jwt(user,role,minutes,secret):
    now = datetime.now(timezone.utc)
    payload = {
            "sub": user,
            "role": role,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=minutes)).timestamp()),
        }
    return jwt.encode(payload, secret, algorithm="HS256")
def require_admin():    
    user = session.get('user')
    if not user:
        abort(403)

    token = request.cookies.get("admin_jwt")
    if not token and request.headers.get("Authorization", "").startswith("Bearer "):
        token = request.headers.get("Authorization").split(" ", 1)[1].strip()
    if not token:
        abort(403)
    try:
        
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET'],
            algorithms=["HS256", "none"],
            options={"verify_signature": False}
        )
    except jwt.InvalidTokenError:
        abort(403)

    
    if payload.get("role") != "admin" or payload.get("sub") != user:
        abort(403)


@admin_bp.route('/admin', methods=['GET', 'POST'])
def admin():
    
    require_admin()

    if request.method == 'POST':
        tpl = request.form.get('template', 'Hello {{ user }}')
       
        return render_template_string(tpl, user=session.get('user'))

    return render_template('admin.html')
