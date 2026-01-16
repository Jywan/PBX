from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import httpx

@dataclass
class AriClient:
    ari_base: str
    ari_app: str
    api_key: str

    async def originate(self, endpoint: str, app_args: str, caller_id: str = "ARI", timeout: int = 30) -> str:
        params = {
            "endpoint": endpoint,
            "app": self.ari_app,
            "appArgs": app_args,
            "callerId": caller_id,
            "timeout": timeout,
            "api_key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f"{self.ari_base}/channels", params=params)
            r.raise_for_status()
            data = r.json()
            cid = data.get("id")
            if not cid:
                raise RuntimeError(f"originate succeeded but channel id in response: {data}")
            return cid
        
    async def create_bridge(self, name: str, bridge_type: str = "mixing") -> str:
        params = {"type": bridge_type, "name": name, "api_key": self.api_key}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f"{self.ari_base}/bridges", params=params)
            r.raise_for_status()
            data = r.json()
            bid = data.get("id")
            if not bid:
                raise RuntimeError(f"create_bridge succeeded but no bridge id: {data}")
            return bid
    
    async def add_channel_to_bridge(self, bridge_id: str, channel_id: str) -> None:
        params = {"channel": channel_id, "api_key": self.api_key}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(f"{self.ari_base}/bridges/{bridge_id}/addChannel", params=params)
            r.raise_for_status()


    async def destroy_bridge(self, bridge_id: str) -> None:
        params = {"api_key": self.api_key}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.delete(f"{self.ari_base}/bridges/{bridge_id}", params=params)
            if r.status_code not in (200, 204, 404):
                r.raise_for_status()
    
    async def hangup_channel(self, channel_id: str) -> None:
        params = {"api_key": self.api_key}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.delete(f"{self.ari_base}/channels/{channel_id}", params=params)
            if r.status_code not in (200, 204, 404):
                r.raise_for_status()