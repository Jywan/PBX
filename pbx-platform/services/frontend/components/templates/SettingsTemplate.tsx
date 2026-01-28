"use client";

import "@/styles/templates/settings.css";

export default function SettingsTemplate() {
    return (
        <div className="settings-container">
            <section className="settings-col settings-col-menu">
                <h3 className="settings-title">설정 항목</h3>
                <div className="settings-placeholder">시스템 / 내선 / 개인</div>
            </section>

            <section className="settings-col settings-col-form">
                <h3 className="settings-title">상세 설정</h3>
                <div className="settings-placeholder">설정 변경 UI 영역</div>
            </section>

            <section className="settings-col settings-col-guide">
                <h3 className="settings-title">가이드</h3>
                <div className="settings-placeholder">항목별 도움말 설명</div>
            </section>
        </div>
    );
}