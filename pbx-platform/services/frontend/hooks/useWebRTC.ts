"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export const useWebRTC = (roomId: string = "test_room") => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    
    // [개선] React State 업데이트 지연을 방지하기 위한 실시간 스트림 참조 Ref
    const localStreamRef = useRef<MediaStream | null>(null);

    const sendSignalMessage = useCallback((message: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        if (pc.current) pc.current.close();

        const config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        };

        const peer = new RTCPeerConnection(config);

        // [중요] Ref를 사용하여 현재 시점의 스트림 트랙을 즉시 추가
        const currentStream = localStreamRef.current;
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                console.log("🎬 트랙 추가 완료:", track.label);
                peer.addTrack(track, currentStream);
            });
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("📡 ICE Candidate 생성됨");
                sendSignalMessage({ type: "ice", candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            console.log("🔊 상대방 오디오 수신 시작");
            setRemoteStream(event.streams[0]);
        };

        pc.current = peer;
        return peer;
    }, [sendSignalMessage]);

    // 신호 처리 (Offer/Answer/ICE)
    const handleSignalingMessage = useCallback(async (message: any) => {
        const { type, sdp, candidate } = message;
        try {
            if (type === "offer") {
                if (!localStreamRef.current) return; // 마이크 없으면 응답 안 함
                const peer = createPeerConnection();
                await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                sendSignalMessage({ type: "answer", sdp: answer });
            } else if (type === "answer") {
                await pc.current?.setRemoteDescription(new RTCSessionDescription(sdp));
            } else if (type === "ice" && candidate) {
                await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (e) {
            console.error("❌ 시그널링 에러:", e);
        }
    }, [createPeerConnection, sendSignalMessage]);

    // 시그널링 서버 연결
    const connectSignaling = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;
        ws.current = new WebSocket(`ws://localhost:8000/ws/signaling/${roomId}`);
        ws.current.onopen = () => console.log("===시그널링 서버 연결완료===");
        ws.current.onmessage = (e) => handleSignalingMessage(JSON.parse(e.data));
    }, [roomId, handleSignalingMessage]);

    // 스트림 시작
    const startLocalStream = useCallback(async (withVideo = false) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            setLocalStream(stream);
            localStreamRef.current = stream; // 즉시 업데이트
            setIsVideoEnabled(withVideo);
            connectSignaling();
            return stream;
        } catch (error) {
            console.error("❌ 미디어 접근 에러:", error);
            return null;
        }
    }, [connectSignaling]);

    // [복구] 음소거 토글 기능
    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
                console.log(`🎤 마이크 상태: ${audioTrack.enabled ? "켜짐" : "음소거"}`);
            }
        }
    }, []);

    // 스트림 종료 및 클린업
    const stopLocalStream = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        localStreamRef.current = null;
        ws.current?.close();
        pc.current?.close();
        setRemoteStream(null);
    }, []);

    // 전화 걸기 (Offer 생성)
    const call = useCallback(async () => {
        if (!localStreamRef.current) return;
        const peer = createPeerConnection();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendSignalMessage({ type: "offer", sdp: offer });
    }, [createPeerConnection, sendSignalMessage]);

    return { 
        localStream, 
        remoteStream, 
        isAudioMuted, 
        isVideoEnabled, 
        startLocalStream, 
        stopLocalStream, 
        toggleAudio, // 다시 추가됨
        call 
    };
};