from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.ari.client import AriClient
from app.ari.parser import ParsedEvent
from app.services.call_recorder import CallRecorder


# 통화 제어 서비스

@dataclass
class CallSession:
    call_id: uuid.UUID
    target_exten: str
    caller_channel_id: str
    callee_channel_id: Optional[str] = None
    bridge_id: Optional[str] = None
    bridged: bool = False
    done: bool =False

class CallService:
    def __init__(self, ari: AriClient, recorder: CallRecorder):
        self.ari = ari
        self.recorder = recorder
        self._lock = asyncio.Lock()

        self._pending_by_exten: dict[str, list[uuid.UUID]] = {}
        self._calls: dict[uuid.UUID, CallSession] = {}
        self._channel_to_call: dict[str, uuid.UUID] = {}

        # # exten별 대기 큐 (동시에 여러통화가 가능하게)
        # self._pending_by_exten: dict[str, list[str]] = {}
        # self._calls: dict[str, CallSession] = {}

        # # channel_id -> call_id 매핑 (hangup cleanup에 사용)
        # self._channel_to_call: dict[str, str] = {}
    
    async def handle_event(self, ev: ParsedEvent) -> None:
        if not ev.etype:
            return
        
        # ---- (A) 이벤트 적재: 모든 이벤트에 대해 실행 ----
        ts: Optional[datetime] = None
        if ev.timestamp:
            t = ev.timestamp
            if len(t) >= 5 and (t[-5] in ("+", "-")) and t[-2:].isdigit():
                t = t[:-5] + t[-5:-2] + ":" + t[-2:]
            try:
                ts = datetime.fromisoformat(t)
            except Exception:
                ts = None

        call_id = None
        if ev.channel_id:
            async with self._lock:
                call_id = self._channel_to_call.get(ev.channel_id)

        await self.recorder.add_event(
            call_id=call_id,
            ts=ts,
            etype=ev.etype,
            channel_id=ev.channel_id,
            bridge_id=None,
            raw=ev.raw,
        )

        if ev.etype == "StasisStart":
            await self._on_stasis_start(ev)
            return
        
        if ev.etype in ("ChannelHangupRequest", "ChannelDestroyed", "StasisEnd"):
            await self._on_hangup_like(ev)
            return
        
    async def _on_stasis_start(self, ev: ParsedEvent) -> None:
        if not ev.channel_id:
            return

        # =========================================================
        # (1) CALLEE 분기: originate로 만들어진 상대방 채널이 들어온 경우
        #     app_args 예: ["callee", "1001"]
        # =========================================================
        if len(ev.app_args) >= 2 and ev.app_args[0] == "callee":
            target_exten = ev.app_args[1]
            async with self._lock:
                await self._attach_callee_and_bridge_locked(target_exten, ev.channel_id)
            return

        # =========================================================
        # (2) CALLER 분기: 최초로 ARI app에 진입한 caller 채널
        #     app_args 예: ["1001"]
        # =========================================================
        if not ev.app_args:
            return

        target_exten = ev.app_args[0]
        call_id = uuid.uuid4()

        # (2-A) 메모리 세션 등록 (락 안에서)
        async with self._lock:
            sess = CallSession(
                call_id=call_id,
                target_exten=target_exten,
                caller_channel_id=ev.channel_id,
            )
            self._calls[call_id] = sess
            self._channel_to_call[ev.channel_id] = call_id
            self._pending_by_exten.setdefault(target_exten, []).append(call_id)

        # (2-B) calls row 생성 (락 밖에서)
        caller_exten: Optional[str] = None
        if ev.channel_name and "/" in ev.channel_name:
            # 예: "PJSIP/1000-00000021" -> "1000"
            caller_exten = ev.channel_name.split("/")[1].split("-")[0]

        await self.recorder.ensure_call_row(
            call_id=call_id,
            caller_exten=caller_exten,
            callee_exten=target_exten,
            caller_channel_id=ev.channel_id,
        )

        # (2-C) 상대방 채널 originate
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

    async def _bridge_pair(self, call_id: uuid.UUID, caller_channel_id: str, callee_channel_id: str) -> None:
        # 이미 hangup으로 세션이 끝났을 수도 있으니 중간중간 체크
        async with self._lock:
            sess = self._calls.get(call_id)
            if not sess or sess.done or sess.bridged:
                return
        
        try:
            bridge_name = f"call-{str(call_id)[:8]}"
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
    
    async def _terminate_call(self, call_id: uuid.UUID) -> None:
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
    
    async def _cleanup_call_locked(self, call_id: uuid.UUID) -> None:
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