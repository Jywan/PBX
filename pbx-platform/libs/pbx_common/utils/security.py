import os
import hashlib
import base64

from dotenv import load_dotenv
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

from passlib.context import CryptContext


# .env 파일로드
load_dotenv()

# bcrypt 알고리즘을 사용하도록 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# pepper 값(필수)
SECRET_PEPPER = os.getenv("PASSWORD_PEPPER")

# JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60* 10        # 10시간

# 환경변수 검증 추가
if not SECRET_PEPPER: 
    raise ValueError("PASSWORD_PEPPER 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

if not ALGORITHM:
    raise ValueError("ALGORITHM 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

def hash_password(password: str) -> str:
    """비밀번호 해시화"""
    peppered_password = f"{SECRET_PEPPER}{password}"

    # 1. SHA-256으로 해싱하여 32바이트 바이너리 데이터 생성
    sha256_bin = hashlib.sha256(peppered_password.encode()).digest()
    
    # 2. bcrypt는 72바이트 제한이 있으므로, 바이너리를 base64 문자열로 변환 (44글자 고정)
    # 이렇게 하면 어떤 입력이든 무조건 72바이트보다 훨씬 짧은 44바이트가 됩니다.
    pre_hash = base64.b64encode(sha256_bin).decode('utf-8')
    
    return pwd_context.hash(pre_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호가 일치하는지 확인합니다."""
    peppered_password = f"{SECRET_PEPPER}{plain_password}"
    
    sha256_bin = hashlib.sha256(peppered_password.encode()).digest()
    pre_hash = base64.b64encode(sha256_bin).decode('utf-8')
    
    return pwd_context.verify(pre_hash, hashed_password)


def create_access_token(data: dict, expire_delta: Optional[timedelta] = None):
    """JWT 토큰 생성"""
    to_encode = data.copy()

    now = datetime.now(timezone.utc)

    if expire_delta:
        expire = now + expire_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # JWT는 'exp' 필드에 타임스탬프 값을 저장
    to_encode.update({"exp": expire})

    encode_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encode_jwt

def decode_access_token(token: str):
    """
    토큰을 받아서 해석(Decode)하여 payload를 반환합니다.
    만료되었거나 위조된 경우 에러를 발생시킵니다.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
