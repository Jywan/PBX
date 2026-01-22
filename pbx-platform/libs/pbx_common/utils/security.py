import os
from passlib.context import CryptContext
from dotenv import load_dotenv

# .env 파일로드
load_dotenv()

# bcrypt 알고리즘을 사용하도록 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# pepper 값(필수)
SECRET_PEPPER = os.getenv("PASSWORD_PEPPER")

def hash_password(password: str) -> str:
    """비밀번호 해시화"""
    peppered_password = f"{SECRET_PEPPER}{password}"
    return pwd_context.hash(peppered_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호가 일치하는지 확인합니다."""
    peppered_password = f"{SECRET_PEPPER}{plain_password}"
    return pwd_context.verify(peppered_password, hashed_password)