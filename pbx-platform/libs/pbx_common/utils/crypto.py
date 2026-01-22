import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # 키가 없을경우 서버 실행을 차단하여 보안 사고 방지
    raise RuntimeError("암호화 키가 .env에 설정되어 있지 않습니다. 보안을 위해 서버를 시작할 수 없습니다.")

# Fernet 적용 (AES 암호화 + HMAC 결합하여 데이터 변조 방지)
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    """
    평문 데이터를 암호화하여 DB 저장용 문자열로 반환
    """
    if not data:
        return data
    
    try:
        # 1. 문자열을 UTF-8 바이트로 변환
        # 2. Fernet 암호화 수행
        # 3. 암호화된 바이트를 다시 문자열(Base64 포맷)로 변환하여 반환
        return cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')
    except Exception as e:
        print(f"암호화 중 오류 발생: {e}")
        return data
    
def decrypt_data(encrypted_data: str) -> str:
    """
    암호화된 문자열을 복호화하여 평문으로 반환
    """
    if not encrypted_data:
        return encrypted_data
    
    try:
        # 1. 암호화된 문자열을 바이트로 변환
        # 2. 키로 복호화 (데이터 변조 여부도 함께 체크됨)
        # 3. 복호화된 바이트를 다시 문자열로 변환
        return cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
    except Exception as e:
        print(f"복호화 실패 (키 불일치 또는 데이터 손상): {e}")
        return "DECRYPTION_ERROR"