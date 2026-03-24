"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { getUserInfoFromToken } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import StatusDropdown from "@/components/ui/StatusDropdown";
import { originateCall } from "@/lib/api/calls";
import apiClient from "@/lib/api/client";
import { API_URL } from "@/lib/config";

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

    const [dialExten, setDialExten] = useState("");
    const [dialing, setDialing] = useState(false);

    useEffect(() => {
        setCurrentActivity(storeActivity || "DISABLED");
    }, [storeActivity]);

    const handleActivityChange = async (newActivity: string) => {
        const token = Cookies.get("access_token");
        try {
            await apiClient.patch(
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

    useEffect(() => {
        const info = getUserInfoFromToken();
        if (info) {
            setUserData({ account: info.sub, name: info.name, role: info.role });
        }
    }, []);

    const handleDial = async () => {
        if (!dialExten.trim()) return;
        const token = Cookies.get("access_token");
        if (!token) return;
        setDialing(true);
        try {
            await originateCall(token, dialExten.trim());
            setDialExten("");
        } catch (err) {
            console.error("발신 실패:", err);
        } finally {
            setDialing(false);
        }
    };

    return (
        <header className="layout-header">
            <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <StatusDropdown
                    currentActivity={currentActivity}
                    onActivityChange={handleActivityChange}
                />

                {/* 발신 위젯 */}
                <div className="dial-widget">
                    <input
                        className="dial-input"
                        type="text"
                        placeholder="010-0000-0000"
                        value={dialExten}
                        onChange={e => setDialExten(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleDial()}
                        disabled={dialing}
                    />
                    <button
                        className="dial-btn"
                        onClick={handleDial}
                        disabled={dialing || !dialExten.trim()}
                    >
                        {dialing ? "발신 중..." : "📞 발신"}
                    </button>
                </div>
            </div>

            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
