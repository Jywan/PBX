"use client";

import { useState } from "react";

export default function Sidebar({ activeMenu, setActiveMenu }: { 
    activeMenu: string, 
    setActiveMenu: (menu: string) => void 
}) {
    // 소메뉴 열림 상태 관리
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);

    const handleMainMenuClick = (menu: string) => {
        setActiveMenu(menu);
        setIsCompanyOpen(false);
    };

    const handleSubMenuClick = (menu: string) => {
        setActiveMenu(menu);
        setIsCompanyOpen(false);
    };

    return (
        <aside className="layout-sidebar">
            {/* handleMainMenuClick을 사용하여 클릭 시 상태 초기화 */}
            <button className={`menu-btn ${activeMenu === "consult" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("consult")}>상담</button>
            <button className={`menu-btn ${activeMenu === "history" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("history")}>이력</button>
            <button className={`menu-btn ${activeMenu === "customer" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("customer")}>고객관리</button>

            <div className="menu-group">
                <button 
                    className={`menu-btn ${isCompanyOpen || activeMenu.startsWith("company-") ? "active" : ""}`} 
                    onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                    업체관리
                </button>
                
                {isCompanyOpen && (
                    <div className="sub-menu-list">
                        <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-info")}>업체정보</button>
                        <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-agent")}>상담원관리</button>
                        <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-ivr")}>IVR트리</button>
                        <button className="sub-menu-btn" onClick={() => handleSubMenuClick("company-queue")}>Queue관리</button>
                    </div>
                )}
            </div>

            <button className={`menu-btn ${activeMenu === "settings" ? "active" : ""}`} 
                    onClick={() => handleMainMenuClick("settings")}>설정</button>
        </aside>
    );
}