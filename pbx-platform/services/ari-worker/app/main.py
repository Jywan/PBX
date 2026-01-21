from __future__ import annotations

import asyncio
import json
import websockets
import logging

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import load_settings
from app.ari.client import AriClient
from app.ari.parser import parse_event
from app.services.call_service import CallService
from app.services.call_recorder import CallRecorder

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def run() -> None:
    settings = load_settings()

    ari = AriClient(
        ari_base=settings.ari_base,
        ari_app=settings.ari_app,
        api_key=settings.api_key,
    )
    
    # 루프 밖에서 한번만 실행하여 연결을 재사용
    await ari.start()

    engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    recorder = CallRecorder(SessionLocal)
    service =  CallService(ari=ari, recorder=recorder)

    logger.info(f"Starting  ARI Worker for app: {settings.ari_app}")

    try:
        while True: # 성공까지 무한루프 
            try:
                logger.info(f"Connecting  to ARI WebSocket: {settings.ari_host}")

                async with websockets.connect(settings.ws_url) as ws:
                    logger.info("ARI WebSocket connected!")
                    
                    # 연결 성공 시 AriClient 시작 
                    async for message in ws:
                        try: 
                            raw = json.loads(message)
                            ev = parse_event(raw)

                            await service.handle_event(ev)
                        except json.JSONDecodeError:
                            logger.error(f"Invalid JSON: {message}")
                        except Exception as e:
                            logger.error(f"Error handling event: {e}")
            except (websockets.ConnectionClosed, ConnectionRefusedError) as e:
                logger.warning(f"Connection lost/refused: {e}. Retrying in 3s...")
            except Exception as e:
                logger.error(f"Unexpected error: {e}. Retrying in 3s...")

            # 재 연결전 대기(Backoff)
            await asyncio.sleep(3)

    finally:
        # 프로그램 종료 시 자원 정리
        logger.info("Shutting down worker...")
        await ari.close()
        await engine.dispose()
        logger.info("Goodbye!")

if __name__ == "__main__":

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        # Ctrl + C 눌렀을 때 지저분한 Traceback 숨기기
        pass