"use client";

import { User } from "lucide-react";
import type { CustomerInfo, WaitingCall } from "@/hooks/useConsultData";

interface ConsultCustomerInfoProps {
    selectedCall: WaitingCall | null;
    customer: CustomerInfo;
}

export default function ConsultCustomerInfo({ selectedCall, customer }: ConsultCustomerInfoProps) {
    return (
        <section className="consult-col col-right-info">
            {!selectedCall ? (
                <div className="consult-empty-state">
                    <User size={40} strokeWidth={1.5} />
                    <p>통화를 선택하면<br />고객 정보가 표시됩니다.</p>
                </div>
            ) : (
                <>
                    <h3 className="consult-section-tilte">고객 프로필</h3>
                    <div className="customer-card">
                        <div className="customer-avatar">{customer.name.charAt(0)}</div>
                        <div className="customer-card-info">
                            <p className="customer-name">{customer.name}</p>
                            <p className="customer-company">{customer.company}</p>
                        </div>
                    </div>
                    <div className="customer-detail">
                        <div className="customer-detail-row">
                            <span className="detail-label">전화번호</span>
                            <span className="detail-value">{customer.phone}</span>
                        </div>
                        <div className="customer-detail-row">
                            <span className="detail-label">이메일</span>
                            <span className="detail-value">{customer.email}</span>
                        </div>
                        {customer.memo && (
                            <div className="customer-memo-box">{customer.memo}</div>
                        )}
                    </div>
                    <div className="history-section">
                        <h4 className="history-title">최근 상담 이력</h4>
                        <div className="history-list">
                            {customer.history.map(h => (
                                <div key={h.id} className="history-item">
                                    <div className="history-item-left">
                                        <span className="history-type">{h.type}</span>
                                        <span className="history-summary">{h.summary}</span>
                                    </div>
                                    <div className="history-itme-right">
                                        <span className="history-date">{h.date}</span>
                                        <span className="histoty-duration">{h.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}