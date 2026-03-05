"use client";

import { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import type { Customer, CustomerGroup } from "@/types/customer";
import type { Company } from "@/types/company";
import { formatPhoneNumber } from "@/lib/utils/validation";

interface CustomerAddModalProps {
    isOpen: boolean;
    groups: CustomerGroup[];
    companies: Company[];
    newForm: Partial<Customer>;
    setNewForm: Dispatch<SetStateAction<Partial<Customer>>>;
    onClose: () => void;
    onSave: () => void;
    isSystemAdmin: boolean;
}

function ModalField({ label, value, onChange, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="modal-field-row">
            <label className="modal-field-label">{label}</label>
            <input className="modal-field-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}

export default function CustomerAddModal({ isOpen, groups, companies, newForm, setNewForm, onClose, onSave, isSystemAdmin }: CustomerAddModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">고객 추가</span>
                    <button className="btn-icon" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <ModalField label="이름 *"     value={newForm.name  ?? ""} onChange={v => setNewForm(p => ({ ...p, name:  v }))} placeholder="홍길동"            />
                    <ModalField label="전화번호 *" value={newForm.phone ?? ""} onChange={v => setNewForm(p => ({ ...p, phone: formatPhoneNumber(v) }))} placeholder="010-0000-0000"     />
                    <ModalField label="이메일"     value={newForm.email ?? ""} onChange={v => setNewForm(p => ({ ...p, email: v }))} placeholder="email@example.com" />
                    <div className="modal-field-row">
                        <label className="modal-field-label">회사</label>
                        <select
                            className="modal-field-input"
                            value={newForm.company_id ?? ""}
                            onChange={e => setNewForm(p => ({ ...p, company_id: e.target.value ? Number(e.target.value) : null }))}
                            disabled={!isSystemAdmin}
                        >
                            <option value="">선택 안함</option>
                            {companies.filter(c => c.active).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-field-row">
                        <label className="modal-field-label">그룹</label>
                        <select
                            className="modal-field-input"
                            value={newForm.group ?? "normal"}
                            onChange={e => setNewForm(p => ({ ...p, group: e.target.value }))}
                        >
                            {groups.filter(g => g.id !== "all").map(g => (
                                <option key={g.id} value={g.id}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-field-row">
                        <label className="modal-field-label">메모</label>
                        <textarea
                            className="modal-field-input"
                            value={newForm.memo ?? ""}
                            onChange={e => setNewForm(p => ({ ...p, memo: e.target.value }))}
                            rows={3} placeholder="메모 입력"
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>취소</button>
                    <button className="btn-modal-save" onClick={onSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
