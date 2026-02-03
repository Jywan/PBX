"use client";

import { useEffect, useState, useRef } from "react";
import { getUserInfoFromToken } from "@/lib/auth";
import { useWebRTC } from "@/hooks/useWebRTC";
import StatusDropdown from "@/components/ui/StatusDropdown";

const roleMap: Record<string, string> = {
    AGENT: "상담원",
    SYSTEM_ADMIN: "시스템 관리자",
    MANAGER: "관리자",
};

export default function Header({ onLogout }: { onLogout: () => void }) {
    const [userData, setUserData] = useState<{ account?: string, name?: string, role?: string } | null>(null);
    const [currentActivity, setCurrentActivity] = useState<string>("DISABLED");

    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const { 
        localStream,
        remoteStream,
        stopLocalStream, 
        isAudioMuted, 
        toggleAudio,
    } = useWebRTC();

    // [연계] 상대방 스트림 수신 시 '통화중' 전환
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            setCurrentActivity("ON_CALL");
            remoteAudioRef.current.play().catch(e => console.error("🔊 재생 실패:", e));
        }
    }, [remoteStream]);

    useEffect(() => {
        const info = getUserInfoFromToken();
        if (info) {
            setUserData({ account: info.sub, name: info.name, role: info.role });
        }
    }, []);

    // [연계] 통화 종료 시 '후처리' 전환
    const handleStopCall = () => {
        stopLocalStream();
        setCurrentActivity("POST_PROCESSING");
    };

    return (
        <header className="layout-header">
            {/* 왼쪽: 상태 관리 및 활성 통화 컨트롤 */}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <audio ref={remoteAudioRef} autoPlay playsInline />
                
                {/* 1. 상담원 상태 드롭다운 (기존 테스트 버튼 자리) */}
                <StatusDropdown 
                    currentActivity={currentActivity} 
                    onActivityChange={setCurrentActivity} 
                />

                {/* 2. 통화 중일 때만 나타나는 제어 버튼 (음소거, 종료) */}
                {localStream && (
                    <div className="call-active-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
                        <div className="call-status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="status-dot blink"></span>
                            <span className="status-text" style={{ fontSize: '14px', fontWeight: '600', color: '#e74c3c' }}>
                                {currentActivity === 'CALLING' ? '연결 중...' : '통화 중'}
                            </span>
                        </div>
                        <button 
                            className={`call-sub-btn ${isAudioMuted ? "muted" : ""}`} 
                            onClick={toggleAudio}
                            style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}
                        >
                            {isAudioMuted ? "🔇 마이크 켬" : "🎤 음소거"}
                        </button>
                        <button 
                            className="call-btn stop" 
                            onClick={handleStopCall}
                            style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                        >
                            종료
                        </button>
                    </div>
                )}
            </div>
            
            {/* 오른쪽: 사용자 프로필 정보 */}
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {userData && (
                    <div className="user-profile-brief">
                        <span className="user-role-tag">
                            {userData.role ? (roleMap[userData.role] || userData.role) : ""}
                        </span>
                        <span className="user-name"><strong>{userData.name}</strong> 님</span>
                    </div>
                )}
                <button onClick={onLogout} className="header-logout-btn">로그아웃</button>
            </div>
        </header>
    );
}