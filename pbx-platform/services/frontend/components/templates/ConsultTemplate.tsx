'use clinet';

import "@/styles/templates/consult.css";

export default function ConsultTemplate() {
    return (
        <div className="consult-container">
            {/* 1단: 목록 */}
            <section className="consult-col col-left-list">
                <h3 className="consult-section-title">인입 목록</h3>
                <div className="consult-box-placeholder">실시간 대기 리스트</div>
            </section>

            {/* 2단: 중앙 작업 */}
            <section className="consult-col col-center-work">
                <h3 className="consult-section-title">상담 진행</h3>
                <div className="consult-box-placeholder">전화 제어 및 메모 입력</div>
            </section>

            {/* 3단: 고객 정보 */}
            <section className="consult-col col-right-info">
                <h3 className="consult-section-title">고객 프로필</h3>
                <div className="consult-box-placeholder">고객 상세 데이터</div>
            </section>
        </div>
    );
}