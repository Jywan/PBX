"use client";

import "@/styles/templates/history.css";

export default function HistoryTemplate() {
    return (
        <div className="history-container">
            {/* 1단: 조회 조건 */}
            <section className="history-col history-col-filter">
                <h3 className="history-title">조회 조건</h3>
                <div className="history-placeholder">날짜 / 기간 / 번호 검색 필터</div>
            </section>

            {/* 2단: 목록 */}
            <section className="history-col history-col-list">
                <h3 className="history-title">통화 목록</h3>
                <div className="history-placeholder">검색 결과 테이블 리스트</div>
            </section>

            {/* 3단: 상세 내역 */}
            <section className="history-col history-col-detail">
                <h3 className="history-title">상세 상담 내역</h3>
                <div className="history-placeholder">선택된 통화의 상세 메모 및 녹취</div>
            </section>
        </div>
    );
}