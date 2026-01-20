from __future__ import annotations

import asyncio
import json
import websockets

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import load_settings
from app.ari.client import AriClient
from app.ari.parser import parse_event
from app.services.call_service import CallService
from app.services.call_recorder import CallRecorder

async def run() -> None:
    settings = load_settings()

    ari = AriClient(
        ari_base=settings.ari_base,
        ari_app=settings.ari_app,
        api_key=settings.api_key,
    )

    engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    recorder = CallRecorder(SessionLocal)
    service =  CallService(ari=ari, recorder=recorder)

    # print("Connecting to ARI:", settings.ws_url)

    async with websockets.connect(settings.ws_url) as ws:
        print("ARI WebSocket connected")

        async for message in ws:
            try:
                raw = json.loads(message)
            except Exception:
                print("[RAW]", message)
                continue
            
            ev = parse_event(raw)

            print(json.dumps({
                "type": ev.etype,
                "timestamp": ev.timestamp,
                "channel_id": ev.channel_id,
                "channel_name": ev.channel_name,
                "app_args": ev.app_args,
            }, ensure_ascii=False))

            await service.handle_event(ev)
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())