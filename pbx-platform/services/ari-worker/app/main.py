import os
import json
import asyncio
import websockets
import httpx

from dotenv import load_dotenv

load_dotenv()

ARI_HOST = os.getenv("ARI_HOST")
ARI_PORT = os.getenv("ARI_PORT")
ARI_APP = os.getenv("ARI_APP")
ARI_USER = os.getenv("ARI_USER")
ARI_PASS = os.getenv("ARI_PASS")

ARI_BASE = f"http://{ARI_HOST}:{ARI_PORT}/ari"
API_KEY = f"{ARI_USER}:{ARI_PASS}"

if not all([ARI_HOST, ARI_APP, ARI_USER, ARI_PASS]):
    raise SystemExit("Missing env. Check your env")

WS_URL = f"ws://{ARI_HOST}:{ARI_PORT}/ari/events?app={ARI_APP}&api_key={ARI_USER}:{ARI_PASS}"

async def originate_callee(exten: str):
    # endpoint는 PJSIP/1001 형태
    endpoint = f"PJSIP/{exten}"

    # callee 채널도 pbx_ari 앱으로 들어오게 해서, 나중에 브릿지 처리까지 확장
    params = {
        "endpoint": endpoint,
        "app": ARI_APP,
        "appArgs": f"callee,{exten}",
        "callerId": "ARI",
        "timeout": 30,
        "api_key": API_KEY
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{ARI_BASE}/channels", params=params)
        r.raise_for_status()
        data = r.json()
        return data.get("id")


async def main():
    print("Connecting to ARI:", WS_URL)
    async with websockets.connect(WS_URL) as ws:
        print("ARI WebSocket connected")

        async for message in ws:
            try: 
                event = json.loads(message)
            except Exception:
                print("[RAW]", message)
                continue
            
            # 데이터 파싱
            etype = event.get("type")
            ts = event.get("timestamp")

            channel = event.get("channel") or {}
            chan_id = channel.get("id")
            chan_name = channel.get("name")

            dialplan = channel.get("dialplan") or {}
            app_data = dialplan.get("app_data")  # 예: "pbx_ari,1001"

            dialed_exten = None
            if isinstance(app_data, str):
                parts = [p.strip() for p in app_data.split(",") if p.strip()]
                # parts[0] = app name, parts[1] = exten
                if len(parts) >= 2:
                    dialed_exten = parts[1]

            if etype == "StasisStart" and dialed_exten:
                try:
                    callee_id = await originate_callee(dialed_exten)
                    print(json.dumps({
                        "action": "originate",
                        "dialed_exten": dialed_exten,
                        "callee_channel_id": callee_id,
                    }, ensure_ascii=False))
                except Exception as e:
                    print("[originate_error]", repr(e))

            print(json.dumps({
                "type": etype,
                "timestamp": ts,
                "channel_id": chan_id,
                "channel_name": chan_name,
                "dialed_exten": dialed_exten,
                "app_data": app_data,
            }, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())