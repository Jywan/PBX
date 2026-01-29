"use client";

import { useEffect, useState, useRef } from "react";
import { getUserInfoFromToken } from "@/lib/auth";
import { useWebRTC } from "@/hooks/useWebRTC";

// 권한 영문명을 한글 표시명으로 변환하는 매핑 객체
const roleMap: Record<string, string> = {
    AGENT: "상담원",
    SYSTEM_ADMIN: "시스템 관리자",
    MANAGER: "관리자",
};

export default function Header({ onLogout }: { onLogout: () => void }) {

    const [userData, setUserData] = useState<{ account?: string, name?: string, role?: string } | null>(null);
    
    // 상대방 소리 출력할 Ref
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const { 
        localStream,
        remoteStream,
        startLocalStream, 
        stopLocalStream, 
        isAudioMuted, 
        toggleAudio, 
        call 
    } = useWebRTC();

    // 상대방 스트림(remoteStream)이 들어오면 오디오 객체에 연결
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            console.log("상대방 오디오 스트림이 스피커에 연결되었습니다.");

            // [중요] 브라우저에 명시적으로 재생 명령을 내림
            remoteAudioRef.current.play()
            .then(() => console.log("🔊 오디오 재생 시작 성공"))
            .catch(error => {
                console.error("❌ 오디오 재생 실패 (브라우저 정책):", error);
                // 실패 시, 사용자가 화면을 한 번 더 클릭하게 유도하거나 
                // 음소거 상태로 시작한 뒤 해제하는 방법이 있습니다.
            });
        }
    }, [remoteStream]);

    useEffect(() => {
        const info = getUserInfoFromToken();
        if (info) {
            setUserData({
                account: info.sub,
                name: info.name,
                role: info.role
            });
        }
    }, []);

    // 통화 시작 버튼 클릭 핸들러
    const handleStartCall = async () => {
        const stream = await startLocalStream(false);
        if (stream) {
            // 소켓 연결 및 미디어 준비 시간을 위해 약간 지연 후(1초) Offer 전송
            setTimeout(() => {
                call();
            }, 1000)
        }
    };

    return (
        <header className="layout-header">
            {/* 통화 컨트롤(왼쪽) */}
            <div className="header-left">
                <audio ref={remoteAudioRef} autoPlay playsInline />
                <div className="call-control-container">
                    {!localStream ? (
                        <button className="call-btn start" onClick={handleStartCall}>
                            <span className="call-icon">📞</span>
                            통화 시작
                        </button>
                    ) : (
                        <div className="call-active-group">
                            <div className="call-status-indicator">
                                <span className="status-dot blink"></span>
                                <span className="status-text">통화 중</span>
                                <div className="speaker-wave">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                            <button className={`call-sub-btn ${isAudioMuted ? "muted" : ""}`} onClick={toggleAudio}>
                                {isAudioMuted ? "🔇 마이크 켬" : "🎤 음소거"}
                            </button>
                            <button className="call-btn stop" onClick={stopLocalStream}>
                                종료
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 로그인 대상 확인 (오른쪽) */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {userData && (
                    <div className="user-profile-brief">
                        <span className="user-role-tag">
                            {userData.role ? (roleMap[userData.role] || userData.role) : ""}
                        </span>
                        <span className="user-name">{userData.name} 님</span>
                    </div>
                )}
                <button onClick={onLogout} className="header-logout-btn">로그아웃</button>
            </div>
        </header>
    );
}