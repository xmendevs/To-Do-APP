from datetime import datetime, timedelta

from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from config import JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY
from database import get_db
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # exp must be an int timestamp; python-jose rejects naive datetimes on
    # decode if they carry sub-second precision in some versions.
    to_encode["exp"] = int(expire.timestamp())
    return jwt.encode(to_encode, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Reject absurdly large tokens early (cheap DoS guard).
    if len(token) > 4096:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise credentials_exception

    username = payload.get("sub")
    if not isinstance(username, str) or not username:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
