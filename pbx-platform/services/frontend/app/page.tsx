"use client";

import { useState, useEffect, use } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { logout as logoutApi } from "@/lib/api/auth";

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
import PermissionTemplate from "@/components/templates/PermissionTemplate";
import UserTemplate from "@/components/templates/UserTemplate";
import IvrTemplate from "@/components/templates/IvrTemplate";

// CSS
import "@/styles/dashboard.css";
import "@/styles/webrtc.css";

export default function HomePage() {
  const { expiresAt, resetAuth } = useAuthStore();
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuthExpiry = () => {
      if (expiresAt && Date.now() > expiresAt) {
        console.warn("인증이 만료 되었습니다. 클라이언트 정보를 초기화합니다.");
        resetAuth();
        Cookies.remove("access_token");
        router.push("/login");
      }
    };
  
    checkAuthExpiry();
    // 1분 마다 체크
    const interval = setInterval(checkAuthExpiry, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, resetAuth, router]);

  const handleLogout = async () => {
    if (token) {
      try {
        await logoutApi(token);
      } catch (e) {
        console.error("서버 로그아웃 처리 실패:", e);
      }
    }
    resetAuth();
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
      case "company-info": return <CompanyTemplate onAccessDenied={() => setActiveMenu("consult")} />;
      case "company-user": return <UserTemplate onAccessDenied={() => setActiveMenu("consult")} />;
      case "company-ivr": return <IvrTemplate />;
      case "company-queue": return <div className="placeholder">Queue 관리 화면 준비중</div>;
      
      case "setting-perm-template": return <PermissionTemplate />;
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