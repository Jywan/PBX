"use client";

import "@/styles/templates/company.css";

export default function CompanyTemplate() {
    return (
        <div className="company-container">
            {/* 1단: 업체 목록 */}
            <section className="company-col company-col-list">
                <h3 className="company-title">업체 목록</h3>
                <div className="company-placeholder">등록된 업체 리스트 및 검색</div>
            </section>

            {/* 2단: 상세 정보 */}
            <section className="company-col company-col-base">
                <h3 className="company-title">업체 기본 정보</h3>
                <div className="company-placeholder">계약 정보 및 기본 설정 편집</div>
            </section>

            {/* 3단: 연동/부가 설정 */}
            <section className="company-col company-col-extra">
                <h3 className="company-title">연동 및 부가 설정</h3>
                <div className="company-placeholder">내선 정보 / 연동 API 설정</div>
            </section>
        </div>
    );
}