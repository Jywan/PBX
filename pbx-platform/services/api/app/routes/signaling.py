from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter()

class SignalingManager:
    def __init__(self):
        # room_id: [websocket1, websocket2] 로 구성
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def send_message(self, message: dict, room_id: str, sender: WebSocket):
        # 나를 제외한 방 안의 다른 사람에게 메세지 전달 (Offer/Answer/Candidate)
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                if connection != sender:
                    await connection.send_json(message)

manager = SignalingManager()

@router.websocket("/ws/signaling/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try: 
        while True:
            # 클라이언트로 부터 JSON 메세지 수신
            data = await websocket.receive_json()
            # 같은 방의 상대에게 그대로 JSON 전달
            await manager.send_message(data, room_id, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)