from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from typing import List, Dict
from jose import jwt, JWTError
import json

from pbx_common.utils.security import SECRET_KEY, ALGORITHM

router = APIRouter(tags=["signaling"])

class SignalingManager:
    def __init__(self):
        # room_id: [websocket1, websocket2] 로 구성
        self.rooms: Dict[str, List[WebSocket]] = {}
        # WebSocket별 사용자정보 저장
        self.user_info: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: int):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)
        self.user_info[websocket] = {"user_id": user_id, "room_id": room_id}

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        # 사용자정보도 삭제
        if websocket in self.user_info:
            del self.user_info[websocket]

    async def send_message(self, message: dict, room_id: str, sender: WebSocket):
        # 나를 제외한 방 안의 다른 사람에게 메세지 전달 (Offer/Answer/Candidate)
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"메세지 전송 실패: {e}")

manager = SignalingManager()

def verify_websocket_token(token: str) -> dict:
    """WebSocket 연결용 토큰 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증 실패"
        )

@router.websocket("/ws/signaling/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str, 
    token: str = Query(..., description="JWT 인증 토큰")
):
    # 1. 토큰 검증
    try:
        payload = verify_websocket_token(token)
        user_id = payload.get("id")
    except HTTPException as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="인증 실패")
        return
    
    # 2. Room ID 검증 (기본적인 형식 체크)
    if not room_id or len(room_id) > 100:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="유효하지 않은 방 ID")
        return
    
    # 3. 연결
    await manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            # 4. 클라이언트로 부터 메시지 수신
            try:
                data = await websocket.receive_text()

                # 5. 메세지 크기 제한 (1MB)
                if len(data) > 1024 * 1024:
                    await websocket.send_json({
                        "type": "error",
                        "message": "메세지 크기가 너무 큽니다."
                    })
                    continue

                # 6. JSON 파싱 및 검증
                message = json.loads(data)

                # 7. 메세지 타입 검증 (WebRTC signaling 메세지만 허용)
                allowed_types = ["offer", "answer", "candidate", "ice-candidate"]
                if "type" not in message or message["type"] not in allowed_types:
                    await websocket.send_json({
                        "type": "error",
                        "message": "유효하지 않은 메시지 타입입니다."
                    })
                    continue

                # 8. 같은 방의 상대에게 전달
                await manager.send_message(message, room_id, websocket)

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "잘못된 JSON 형식입니다."
                })
            except Exception as e:
                print(f"메시지 처리 오류: {e}")
                break

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)