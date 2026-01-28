"use client";

import { useEffect, useState } from "react";
import { getUserInfoFromToken } from "@/lib/auth";

// 권한 영문명을 한글 표시명으로 변환하는 매핑 객체
const roleMap: Record<string, string> = {
    AGENT: "상담원",
    SYSTEM_ADMIN: "시스템 관리자",
    MANAGER: "관리자",
};

export default function Header({ onLogout }: { onLogout: () => void }) {

    const [userData, setUserData] = useState<{ account?: string, name?: string, role?: string } | null>(null);

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

    return (
        <header className="layout-header">
            <div className="header-left"></div>
            
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