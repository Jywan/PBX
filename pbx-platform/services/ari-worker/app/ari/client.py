from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import httpx

@dataclass
class AriClient:
    ari_base: str
    ari_app: str
    api_key: str        # user""

    _client: Optional[httpx.AxyncClient] = None

    async def start(self) -> None:
        """애플리케이션 시작 시 한 번만 호출: HTTP 세션 생성"""
        if self._client is not None:
            return
        
        # api_key("user:pass")를 분리하여 HTTP Basic Auth로 사용
        auth = None
        if ":" in self.api_key:
            u, p = self.api_key.split(":", 1)
            auth = (u, p)

        self._client = httpx.AsyncClient(
            base_url=self.ari_base,
            auth=auth,  # 헤더 인증 방식 권장
            timeout=10.0,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
        )
    
    async def close(self) -> None:
        """애플리케이션 종료 시 호출"""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _request(self, method: str, path: str, params: dict = None) -> dict:
        """내부 헬퍼 메소드: 반복되는 요청 로직 통합"""
        if self._client is None:
            raise RuntimeError("AriClient is not started. Call await client.start() first.")
        
        # 공통 파라미터 병합
        final_params = {"app": self.ari_app}
        if params:
            final_params.update(params)
        
        response = await self._client.request(method, path, params=final_params)

        # 404 등 에러 처리 (필요시 커스텀 예외로 변경 가능)
        if response.status_code not in (200, 204):
            response.raise_for_status()

        if response.status_code == 204:
            return {}
        
        return response.json()
    
    async def originate(self, endpoint: str, app_args: str, caller_id: str = "ARI", timeout: int = 30) -> str:
        params = {
            "endpoint": endpoint,
            "appArgs": app_args,
            "caller_id": caller_id,
            "timeout": timeout,
        }

        # POST /channels
        data = await self._request("POST", "/channels", params=params)

        cid = data.get("id")
        if not cid:
            raise RuntimeError(f"originate succeeded but no channel id: {data}")
        return cid
    
    async def create_bridge(self, name: str, bridge_type: str = "mixing") -> str:
        params = {"type": bridge_type, "name": name}
        data = await self._request("POST", "/bridges", params=params)

        bid = data.get("id")
        if not bid:
            raise RuntimeError(f"create_bridge succeeded but no bridge id: {data}")
        return bid
    
    async def add_channel_to_bridge(self, bridge_id: str, channel_id: str) -> None:
        params = {"channel": channel_id}
        await self._request("POST", f"/bridges/{bridge_id}/addChannel", params=params)

    async def destroy_bridge(self, bridge_id: str) -> None:
        try:
            await self._request("DELETE", f"/bridges/{bridge_id}")
        except httpx.HTTPStatusError as e:
            # 이미 삭제된 경우(404)는 무시
            if e.response.status_code != 404:
                raise
    
    async def hangup_channel(self, channel_id: str) -> None:
        try:
            await self._request("DELETE", f"/channels/{channel_id}")
        except httpx.HTTPStatusError as e:
            # 이미 끊긴 경우(404)는 무시
            if e.response.status_code != 404:
                raise