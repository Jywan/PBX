from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Optional

from app.ari.client import AriClient
from app.ari.parser import ParsedEvent

@dataclass
class CallSession:
    call_id: str
    target_exten: str
    caller_channel_id: str
    callee_channel_id: Optional[str] = None
    bridge_id: Optional[str] = None
    bridged: bool = False
    done: bool =False

class CallService:
    def __init__(self, ari: AriClient):
        self.ari = ari
        self._lock = asyncio.Lock()

        # exten별 대기 큐 (동시에 여러통화가 가능하게)
        self._pending_by_exten: dict[str, list[str]] = {}
        self._calls: dict[str, CallSession] = {}

        # channel_id -> call_id 매핑 (hangup cleanup에 사용)
        self._channel_to_call: dict[str, str] = {}
    
    async def handle_event(self, ev: ParsedEvent) -> None:
        if not ev.etype:
            return
        
        if ev.etype == "StasisStart":
            await self._on_stasis_start(ev)
            return
        
        if ev.etype in ("ChannelHangupRequest", "ChannelDestroyed", "StasisEnd"):
            await self._on_hangup_like(ev)
            return
        
    async def _on_stasis_start(self, ev: ParsedEvent) -> None:
        if not ev.channel_id:
            return
        
        async with self._lock:
            if len(ev.app_args) >= 2 and ev.app_args[0] == "callee":
                target_exten = ev.app_args[1]
                await self._attach_callee_and_bridge_locked(target_exten, ev.channel_id)
                return
            
            if not ev.app_args:
                return
            
            target_exten = ev.app_args[0]
            call_id = uuid.uuid4().hex

            sess = CallSession(
                call_id=call_id,
                target_exten=target_exten,
                caller_channel_id=ev.channel_id,
            )
            self._calls[call_id] = sess
            self._channel_to_call[ev.channel_id] = call_id
            self._pending_by_exten.setdefault(target_exten, []).append(call_id)

        try:
            callee_channel_id = await self.ari.originate(
                endpoint=f"PJSIP/{target_exten}",
                app_args=f"callee,{target_exten}",
                caller_id="ARI",
                timeout=30,
            )
            print({"action": "originate", "dialed_exten": target_exten, "callee_channel_id": callee_channel_id})
        except Exception as e:
            print("[originate_error]", repr(e))
            # 실패시 세션 정리
            async with self._lock:
                await self._cleanup_call_locked(call_id)

    async def _attach_callee_and_bridge_locked(self, target_exten: str, callee_channel_id: str) -> None:
        q = self._pending_by_exten.get(target_exten) or []
        if not q:
            # 대기중인 caller가 없으면 callee만 떠있을수가 있음
            return
        
        call_id = q.pop(0)
        sess = self._calls.get(call_id)
        if not sess or sess.done:
            return
        
        sess.callee_channel_id = callee_channel_id
        self._channel_to_call[callee_channel_id] = call_id

        # bridge 생성 및 add는 lock 밖에서
        caller_id = sess.caller_channel_id

        # lock 해제 후 작업하도록 정보 복사
        asyncio.create_task(self._bridge_pair(call_id, caller_id, callee_channel_id))

    async def _bridge_pair(self, call_id: str, caller_channel_id: str, callee_channel_id: str) -> None:
        # 이미 hangup으로 세션이 끝났을 수도 있으니 중간중간 체크
        async with self._lock:
            sess = self._calls.get(call_id)
            if not sess or sess.done or sess.bridged:
                return
        
        try:
            bridge_name = f"call-{call_id[:8]}"
            bridge_id = await self.ari.create_bridge(name=bridge_name, bridge_type="mixing")

            await self.ari.add_channel_to_bridge(bridge_id, caller_channel_id)
            await self.ari.add_channel_to_bridge(bridge_id, callee_channel_id)

            async with self._lock:
                sess = self._calls.get(call_id)
                if sess and not sess.done:
                    sess.bridge_id = bridge_id
                    sess.bridged = True
            
            print({"action": "bridge", "call_id": call_id, "bridge_id": bridge_id})

        except Exception as e:
            print("[bridge_error]", repr(e))
            # 브릿지 실패시 양쪽 정리 시도
            await self._terminate_call(call_id)

    async def _on_hangup_like(self, ev: ParsedEvent) -> None:
        if not ev.channel_id:
            return
        
        async with self._lock:
            call_id = self._channel_to_call.get(ev.channel_id)
        if not call_id:
            return
        
        await self._terminate_call(call_id)
    
    async def _terminate_call(self, call_id: str) -> None:
        async with self._lock:
            sess = self._calls.get(call_id)
            if not sess or sess.done:
                return
            sess.done = True

            caller = sess.caller_channel_id
            callee = sess.callee_channel_id
            bridge_id = sess.bridge_id

        # REST 정리는 lock 밖에서
        # 상대 채널 hangup(404는 무시됨)
        if caller:
            await self.ari.hangup_channel(caller)
        if callee:
            await self.ari.hangup_channel(callee)
        if bridge_id:
            await self.ari.destroy_bridge(bridge_id)

        async with self._lock:
            await self._cleanup_call_locked(call_id)
    
    async def _cleanup_call_locked(self, call_id: str) -> None:
        sess = self._calls.pop(call_id, None)
        if not sess:
            return
        
        # pending 큐에서 제거
        q = self._pending_by_exten.get(sess.target_exten)
        if q: 
            self._pending_by_exten[sess.target_exten] = [x for x in q if x != call_id]
            if not self._pending_by_exten[sess.target_exten]:
                self._pending_by_exten.pop(sess.target_exten, None)
            
        # channel_to_call 정리
        if sess.caller_channel_id:
            self._channel_to_call.pop(sess.caller_channel_id, None)
        if sess.callee_channel_id:
            self._channel_to_call.pop(sess.callee_channel_id, None)