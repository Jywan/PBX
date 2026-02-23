"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { getUserInfoFromToken } from "@/lib/auth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuthStore } from "@/store/authStore";
import StatusDropdown from "@/components/ui/StatusDropdown";

const roleMap: Record<string, string> = {
    AGENT: "상담원",
    SYSTEM_ADMIN: "시스템 관리자",
    MANAGER: "관리자",
};

export default function Header({ onLogout }: { onLogout: () => void }) {
    const [userData, setUserData] = useState<{ account?: string, name?: string, role?: string } | null>(null);

    const storeActivity = useAuthStore((state) => state.activity);
    const setStoreActivity = useAuthStore((state) => state.setActivity);
    const [currentActivity, setCurrentActivity] = useState<string>(storeActivity || "DISABLED");

    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const {
        localStream,
        remoteStream,
        stopLocalStream,
        isAudioMuted,
        toggleAudio,
    } = useWebRTC();

    // store activity가 외부(로그인 등)에서 바뀌면 동기화
    useEffect(() => {
        setCurrentActivity(storeActivity || "DISABLED");
    }, [storeActivity]);

    // activity 변경 공통 함수 (API 호출 + 상태 업데이트)
    const handleActivityChange = async (newActivity: string) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get('access_token');
        try {
            await axios.patch(
                `${API_URL}/api/v1/auth/activity`,
                { activity: newActivity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCurrentActivity(newActivity);
            setStoreActivity(newActivity);
        } catch (err) {
            console.error("상태 변경 실패:", err);
        }
    };

    // [연계] 상대방 스트림 수신 시 '통화중' 전환
    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            handleActivityChange("ON_CALL");
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
        handleActivityChange("POST_PROCESSING");
    };

    return (
        <header className="layout-header">
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <audio ref={remoteAudioRef} autoPlay playsInline />

                <StatusDropdown
                    currentActivity={currentActivity}
                    onActivityChange={handleActivityChange}
                />

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
