from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # 필수 변수
    database_url: str

    # 선택 변수 (기본값 있음)
    api_title: str = "PBX API"
    api_version: str = "0.1.0"

    # 설정: .env  파일 위치 지정
    model_config = SettingsConfigDict(env_file="../../.env", env_file_encoding="utf-8", extra="ignore")

# 설정을 캐싱하여 매번 파일을 읽지 않도록 함 (싱글톤 효과)
@lru_cache
def get_settings() -> Settings:
    return Settings()