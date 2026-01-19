from __future__ import annotations

import asyncio
import json
import websockets

from app.core.config import load_settings
from app.ari.client import AriClient
from app.ari.parser import parse_event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.services.call_service import CallService
from app.services.call_recorder import CallRecorder

async def run() -> None:
    settings = load_settings()

    ari = AriClient(
        ari_base=settings.ari_base,
        ari_app=settings.ari_app,
        api_key=settings.api_key,
    )
    
    # DB 엔진/세션메이커 생성
    engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db_session:
        recorder = CallRecorder(db_session)
        service = CallService(ari=ari, recorder=recorder)

        async with websockets.connect(settings.ws_url) as ws:
            print("ARI WebSocket connected")

            async for message in ws:
                try:
                    raw = json.loads(message)
                except Exception:
                    print("[RAW]", message)
                    continue

                ev = parse_event(raw)

                # 최소 로그만 출력
                print(json.dumps({
                    "type": ev.etype,
                    "timestamp": ev.timestamp,
                    "channel_id": ev.channel_id,
                    "channel_name": ev.channel_name,
                    "app_args": ev.app_args,
                }, ensure_ascii=False))

                await service.handle_event(ev)

                # Session을 쓰는 구조는 여기서부터 성립함.
                await db_session.commit()
                
if __name__ == "__main__":
    asyncio.run(run())
