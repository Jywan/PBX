"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { WaitingCall } from "@/hooks/useConsultData";
import type { Customer } from "@/types/customer";
import type { CustomerCreate } from "@/lib/api/customers";

interface ConsultCustomerInfoProps {
    selectedCall: WaitingCall | null;
    customer: Customer | null;
    onCreateCustomer: (data: CustomerCreate) => Promise<void>;
}

export default function ConsultCustomerInfo({ selectedCall, customer, onCreateCustomer }: ConsultCustomerInfoProps) {
    const [form, setForm] = useState<CustomerCreate>({ name: "", phone: selectedCall?.callerNumber ?? "", group: "normal" });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.phone.trim()) return;
        setSaving(true);
        try {
            await onCreateCustomer({ ...form, name: form.name.trim() || "임시", phone: form.phone || selectedCall?.callerNumber || "" });
        } finally {
            setSaving(false);
        }
    };

    if (!customer) {
        return (
            <section className="consult-col col-right-info">
                <h3 className="consult-section-title">고객 등록</h3>
                <form className="customer-register-form" onSubmit={handleSubmit}>
                    <div className="creg-row">
                        <label className="creg-label">이름</label>
                        <input
                            className="creg-input"
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="고객 이름 (공란 시 임시)"
                        />
                    </div>
                    <div className="creg-row">
                        <label className="creg-label">전화번호 *</label>
                        <input
                            className="creg-input"
                            value={form.phone}
                            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                            placeholder={selectedCall?.callerNumber ?? "전화번호"}
                        />
                    </div>
                    <div className="creg-row">
                        <label className="creg-label">그룹</label>
                        <select
                            className="creg-input"
                            value={form.group ?? "normal"}
                            onChange={e => setForm(p => ({ ...p, group: e.target.value }))}
                        >
                            <option value="normal">일반</option>
                            <option value="vip">VIP</option>
                            <option value="blacklist">블랙리스트</option>
                        </select>
                    </div>
                    <div className="creg-row">
                        <label className="creg-label">이메일</label>
                        <input
                            className="creg-input"
                            value={form.email ?? ""}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="이메일 (선택)"
                        />
                    </div>
                    <div className="creg-row">
                        <label className="creg-label">메모</label>
                        <textarea
                            className="creg-textarea"
                            value={form.memo ?? ""}
                            onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                            placeholder="메모 (선택)"
                        />
                    </div>
                    <button className="creg-btn-submit" type="submit" disabled={!form.phone.trim() || saving}>
                        <UserPlus size={14} />
                        {saving ? "등록 중..." : "고객 등록"}
                    </button>
                </form>
            </section>
        );
    }

    return (
        <section className="consult-col col-right-info">
            <h3 className="consult-section-title">고객 프로필</h3>
            <div className="customer-card">
                <div className="customer-avatar">{customer.name.charAt(0)}</div>
                <div className="customer-card-info">
                    <p className="customer-name">{customer.name}</p>
                    <p className="customer-company">{customer.company_name ?? "-"}</p>
                </div>
            </div>
            <div className="customer-detail">
                <div className="customer-detail-row">
                    <span className="detail-label">전화번호</span>
                    <span className="detail-value">{customer.phone}</span>
                </div>
                <div className="customer-detail-row">
                    <span className="detail-label">이메일</span>
                    <span className="detail-value">{customer.email ?? "-"}</span>
                </div>
                <div className="customer-detail-row">
                    <span className="detail-label">그룹</span>
                    <span className={`detail-value customer-group-badge group-${customer.group}`}>
                        {{ normal: "일반", vip: "VIP", blacklist: "블랙리스트" }[customer.group] ?? customer.group}
                    </span>
                </div>
                {customer.memo && (
                    <div className="customer-memo-box">{customer.memo}</div>
                )}
            </div>
        </section>
    );
}
