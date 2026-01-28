"use client";

import "@/styles/templates/customer.css";

export default function CustomerTemplate() {
    return (
        <div className="customer-container">
            <section className="customer-col customer-col-groups">
                <h3 className="customer-title">고객 그룹</h3>
                <div className="customer-placeholder">그룹 및 카테고리</div>
            </section>

            <section className="customer-col customer-col-list">
                <h3 className="customer-title">고객 명단</h3>
                <div className="customer-placeholder">고객 목록 테이블</div>
            </section>

            <section className="customer-col customer-col-detail">
                <h3 className="customer-title">고객 상세 프로필</h3>
                <div className="customer-placeholder">상세 정보 및 편집 폼</div>
            </section>
        </div>
    );
}