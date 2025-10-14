from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'

def create_sample_users():
    from models import User
    if not User.query.filter_by(email='alice@example.com').first():
        user1 = User(username='alice', email='alice@example.com', password='password123')
        user2 = User(username='bob', email='bob@example.com', password='securepass')
        db.session.add_all([user1, user2])
        db.session.commit()
        print("[+] Sample users created.")
    else:
        print("[=] Sample users already exist.")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    from auth.routes import auth_bp
    from emails.routes import emails_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(emails_bp)

    with app.app_context():
        db.create_all()
        create_sample_users()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
