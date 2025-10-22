import os
import sqlite3
import secrets
import hashlib
from hashlib import md5
from datetime import datetime, timedelta, timezone

import jwt

base = os.environ.get("Q_SECRET", "qnqsec-default")
SECRET_KEY = hashlib.sha1(("pepper:" + base).encode()).hexdigest()
JWT_SECRET = hashlib.sha256(("jwtpepper:" + base).encode()).hexdigest()
print("secret_key: ",SECRET_KEY)
print("jwt_secret: ",JWT_SECRET)
