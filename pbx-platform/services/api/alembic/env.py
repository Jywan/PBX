import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# alembic.ini 로그 설정 로드
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── 모델 메타데이터 임포트 ──────────────────────────────
# 모든 모델이 Base.metadata에 등록되도록 전부 임포트
from pbx_common.models import Base  # noqa: F401 — 모든 테이블 등록
import pbx_common.models  # noqa: F401

target_metadata = Base.metadata

# ── DATABASE_URL 주입 ──────────────────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../.env"))

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL 환경변수가 설정되지 않았습니다.")

# asyncpg URL을 alembic용 sync URL로도 사용 가능하게 변환
# asyncpg → postgresql+asyncpg (alembic은 async engine 사용)
config.set_main_option("sqlalchemy.url", db_url)


def run_migrations_offline() -> None:
    """오프라인 모드: DB 연결 없이 SQL 스크립트만 생성"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """온라인 모드: 비동기 엔진으로 실제 DB에 마이그레이션 적용"""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
