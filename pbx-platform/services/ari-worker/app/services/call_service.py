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
        self._channel_to_bridge: dict[str, str] = {}
    
    async def handle_event(self, ev: ParsedEvent) -> None:
        if not ev.etype:
            return
        
        # StasisStart 선처리 (call_id 매핑을 먼저 잡는다)
        if ev.etype == "StasisStart":
            await self._on_stasis_start(ev)

        # Bridge 매핑 선처리 (raw에서 bridge.id를 뽑아 channel->bridge 갱신)
        if ev.channel_id:
                b = (ev.raw.get("bridge") or {})
                b_id = b.get("id")
                if b_id:
                    async with self._lock:
                        self._channel_to_bridge[ev.channel_id] = b_id

        # ts 파싱
        ts: Optional[datetime] = None
        if ev.timestamp:
            t = ev.timestamp
            if len(t) >= 5 and (t[-5] in ("+", "-")) and t[-2:].isdigit():
                t = t[:-5] + t[-5:-2] + ":" + t[-2:]
            try:
                ts = datetime.fromisoformat(t)
            except Exception:
                ts = None

        # call_id / bridge_id 조회
        call_id: Optional[uuid.UUID] = None
        bridge_id: Optional[str] = None
        if ev.channel_id:
            async with self._lock:
                call_id = self._channel_to_call.get(ev.channel_id)
                bridge_id = self._channel_to_bridge.get(ev.channel_id)
        
        # 이벤트 적재
        await self.recorder.add_event(
            call_id=call_id,
            ts=ts,
            etype=ev.etype,
            channel_id=ev.channel_id,
            bridge_id=bridge_id,
            raw=ev.raw,
        )

        # 종료 이벤트 처리
        if ev.etype in ("ChannelHangupRequest", "ChannelDestroyed"):
            await self._on_hangup_like(ev)
            return
        
    async def _on_stasis_start(self, ev: ParsedEvent) -> None:
        if not ev.channel_id:
            return

        if len(ev.app_args) >= 2 and ev.app_args[0] == "callee":
            target_exten = ev.app_args[1]
            async with self._lock:
                await self._attach_callee_and_bridge_locked(target_exten, ev.channel_id)
            return

        if not ev.app_args:
            return

        target_exten = ev.app_args[0]
        call_id = uuid.uuid4()

        async with self._lock:
            sess = CallSession(
                call_id=call_id,
                target_exten=target_exten,
                caller_channel_id=ev.channel_id,
            )
            self._calls[call_id] = sess
            self._channel_to_call[ev.channel_id] = call_id
            self._pending_by_exten.setdefault(target_exten, []).append(call_id)

        caller_exten: Optional[str] = None
        if ev.channel_name and "/" in ev.channel_name:
            caller_exten = ev.channel_name.split("/")[1].split("-")[0]

        await self.recorder.ensure_call_row(
            call_id=call_id,
            caller_exten=caller_exten,
            callee_exten=target_exten,
            caller_channel_id=ev.channel_id,
        )

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
            return
        
        call_id = q.pop(0)
        sess = self._calls.get(call_id)
        if not sess or sess.done:
            return
        
        sess.callee_channel_id = callee_channel_id
        self._channel_to_call[callee_channel_id] = call_id

        caller_id = sess.caller_channel_id

        asyncio.create_task(self._bridge_pair(call_id, caller_id, callee_channel_id))

    async def _bridge_pair(self, call_id: uuid.UUID, caller_channel_id: str, callee_channel_id: str) -> None:
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
                self._channel_to_bridge[caller_channel_id] = bridge_id
                self._channel_to_bridge[callee_channel_id] = bridge_id

                sess = self._calls.get(call_id)
                if sess and not sess.done:
                    sess.bridge_id = bridge_id

            await self.recorder.mark_bridged(
                call_id=call_id,
                bridge_id=bridge_id,
                caller_channel_id=caller_channel_id,
                callee_channel_id=callee_channel_id,
            )
            
            print({"action": "bridge", "call_id": call_id, "bridge_id": bridge_id})

        except Exception as e:
            print("[bridge_error]", repr(e))
            await self.recorder.mark_failed(call_id, reason=repr(e))

            await self._terminate_call(call_id)

    async def _on_hangup_like(self, ev: ParsedEvent) -> None:
        if not ev.channel_id:
            return
        
        async with self._lock:
            call_id = self._channel_to_call.get(ev.channel_id)

        if not call_id:
            return

        ended_at: Optional[datetime] = None
        if ev.timestamp:
            t = ev.timestamp
            if len(t) >= 5 and (t[-5] in ("+", "-")) and t[-2:].isdigit():
                t = t[:-5] + t[-5:-2] + ":" + t[-2:]
            try:
                ended_at = datetime.fromisoformat(t)
            except Exception:
                ended_at = None
        
        cause: Optional[int] = None
        cause_txt: Optional[str] = None

        raw = ev.raw or {}
        c = raw.get("cause")
        if isinstance(c, int):
            cause = c
        elif isinstance(c, str) and c.isdigit():
            cause = int(c)

        ct = raw.get("cause_txt") or raw.get("causeText")  # 혹시 변형 대비
        if isinstance(ct, str) and ct.strip():
            cause_txt = ct.strip()
        else:
            # cause_txt가 없으면 이벤트 타입이라도 남겨 추적 가능하게
            cause_txt = ev.etype

        await self.recorder.mark_ended(
            call_id=call_id,
            ended_at=ended_at,
            hangup_cause=cause,
            hangup_reason=cause_txt,
        )
        
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

        try:
            await self.recorder.mark_ended(
                call_id=call_id,
                ended_at=datetime.now().astimezone(),
                hangup_cause=None,
                hangup_reason="hangup",
            )
        except Exception as e:
            print("[db_martk_ended_error]", repr(e))

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
        
        q = self._pending_by_exten.get(sess.target_exten)
        if q: 
            self._pending_by_exten[sess.target_exten] = [x for x in q if x != call_id]
            if not self._pending_by_exten[sess.target_exten]:
                self._pending_by_exten.pop(sess.target_exten, None)
            
        if sess.caller_channel_id:
            self._channel_to_call.pop(sess.caller_channel_id, None)
            self._channel_to_bridge.pop(sess.caller_channel_id, None)
        if sess.callee_channel_id:
            self._channel_to_call.pop(sess.callee_channel_id, None)
            self._channel_to_bridge.pop(sess.callee_channel_id, None)