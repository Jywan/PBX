"use client";

import { useState, useEffect } from "react";
import { isSystemAdmin, hasPermission } from "@/lib/auth";

export default function Sidebar({ activeMenu, setActiveMenu }: {
    activeMenu: string,
    setActiveMenu: (menu: string) => void
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = isSystemAdmin();
    const canAccess = (menuCode: string) => isAdmin || hasPermission(menuCode);

    const [openPopup, setOpenPopup] = useState<string | null>(null);

    // 메인 메뉴 클릭 시 모든 팝업 닫기
    const handleMainMenuClick = (menu: string) => {
        setActiveMenu(menu);
        setOpenPopup(null);
    };

    // 서브 메뉴 클릭 시 팝업 닫고 메뉴 활성화
    const handleSubMenuClick = (menu: string) => {
        setActiveMenu(menu);
        setOpenPopup(null);
    };

    // 팝업 토글 로직: 이미 열려있는 걸 누르면 닫고, 아니면 해당 팝업을 염
    const togglePopup = (popupName: string) => {
        if (openPopup === popupName) {
            setOpenPopup(null);
        } else {
            setOpenPopup(popupName);
        }
    };

    if (!mounted) {
        return <aside className="layout-sidebar"></aside>;
    }

    return (
        <aside className="layout-sidebar">
            {canAccess("consult") && (
                <button className={`menu-btn ${activeMenu === "consult" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("consult")}>상담</button>
            )}
            {canAccess("history") && (
                <button className={`menu-btn ${activeMenu === "history" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("history")}>이력</button>
            )}
            {canAccess("customer") && (
                <button className={`menu-btn ${activeMenu === "customer" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("customer")}>고객관리</button>
            )}

            {/* 업체관리 그룹 */}
            {canAccess("company") && (
                <div className="menu-group">
                    <button 
                        className={`menu-btn ${openPopup === "company" || activeMenu.startsWith("company-") ? "active" : ""}`} 
                        onClick={() => togglePopup("company")}
                    >
                        업체관리
                    </button>
                    
                    {openPopup === "company" && (
                        <div className="sub-menu-list">
                            {canAccess("company-info") && (
                                <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-info")}>업체정보</button>
                            )}
                            {canAccess("agent") && (
                                <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-user")}>사용자관리</button>
                            )}
                            {canAccess("ivr-tree") && (
                                <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-ivr")}>IVR트리</button>
                            )}
                            {canAccess("queue") && (
                                <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-queue")}>Queue관리</button>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* 시스템 설정 그룹 - 시스템 관리자만 표시 */}
            {isAdmin && (
                <div className="menu-group">
                    <button
                        className={`menu-btn ${openPopup === "setting" || activeMenu.startsWith("setting-") ? "active" : ""}`}
                        onClick={() => togglePopup("setting")}
                    >
                        시스템 설정
                    </button>

                    {openPopup === "setting" && (
                        <div className="sub-menu-list">
                            <button className="sub-menu-btn" onClick={() => handleSubMenuClick("setting-perm-template")}>권한 템플릿설정</button>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}