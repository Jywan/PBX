"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

// 레이아웃
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer";
import MainContent from "@/components/layout/MainContent";

// 템플릿
import ConsultTemplate from "@/components/templates/ConsultTemplate";
import HistoryTemplate from "@/components/templates/HistoryTemplate";
import CustomerTemplate from "@/components/templates/CustomerTemplate";
import CompanyTemplate from "@/components/templates/CompanyTemplate";
import SettingsTemplate from "@/components/templates/SettingsTemplate";

// CSS
import "@/styles/dashboard.css";
import "@/styles/webrtc.css";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("access_token");
    router.push("/login");
  };

  const [activeMenu, setActiveMenu] = useState("consult");

  const renderTemplate = () => {
    switch (activeMenu) {
      case "consult": return <ConsultTemplate />;
      case "history": return <HistoryTemplate />;
      case "customer": return <CustomerTemplate />;
      
      /* 직접 정해주신 업체관리 소메뉴 분기 */
      case "company-info": return <CompanyTemplate />;
      case "company-agent": return <div className="placeholder">상담원 관리 전용 화면 준비중</div>;
      case "company-ivr": return <div className="placeholder">IVR트리 설정 화면 준비중</div>;
      case "company-queue": return <div className="placeholder">Queue 관리 화면 준비중</div>;
      
      case "settings": return <SettingsTemplate />;
      default: return <ConsultTemplate />;
    }
  };

  return (
    <div className="layout-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu}/>
      
      <div className="layout-content-wrapper">
        <Header onLogout={handleLogout}/>
        
        <MainContent>
            {renderTemplate()}
        </MainContent>

        <Footer />
      </div>
    </div>
  );
}