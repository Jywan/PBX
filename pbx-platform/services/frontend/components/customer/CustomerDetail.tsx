"use client";

import { Dispatch, SetStateAction } from "react";
import { User, Edit3, Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";
import { formatPhoneNumber } from "@/lib/utils/validation";
import type { Customer, CustomerGroup, CallHistory } from "@/types/customer";
import type { Company } from "@/types/company";

interface CustomerDetailProps {
    selectedCustomer: Customer | null;
    editMode: boolean;
    editForm: Partial<Customer>;
    groups: CustomerGroup[];
    companies: Company[];
    calls: CallHistory[];
    setEditForm: Dispatch<SetStateAction<Partial<Customer>>>;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: () => void;
    getGroupLabel: (id: string) => string;
    getGroupColor: (id: string) => string;
    isSystemAdmin: boolean;
    canUpdate: boolean;
}

function DetailField({ label, value, editMode, onChange }: {
    label: string;
    value: string;
    editMode: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <div className="detail-field-row">
            <span className="detail-field-label">{label}</span>
            {editMode ? (
                <input className="detail-field-input" value={value} onChange={e => onChange(e.target.value)} />
            ) : (
                <span className="detail-field-value">{value || "-"}</span>
            )}
        </div>
    );
}

export default function CustomerDetail({
    selectedCustomer, editMode, editForm, groups, companies, calls,
    setEditForm, onEditStart, onEditCancel, onEditSave,
    getGroupLabel, getGroupColor, isSystemAdmin, canUpdate,
}: CustomerDetailProps) {
    if (!selectedCustomer) {
        return (
            <section className="customer-col customer-col-detail">
                <div className="customer-empty">
                    <User size={36} strokeWidth={1.5} />
                    <p>고객을 선택하면<br />상세 정보가 표시됩니다.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="customer-col customer-col-detail">
            <div className="detail-header">
                <div className="detail-name-wrap">
                    <span className="detail-name">{selectedCustomer.name}</span>
                    <span
                        className="group-badge"
                        style={{ background: getGroupColor(selectedCustomer.group) + "22", color: getGroupColor(selectedCustomer.group) }}
                    >
                        {getGroupLabel(selectedCustomer.group)}
                    </span>
                </div>
                <div className="detail-actions">
                    {!editMode ? (
                        canUpdate && (
                            <button className="btn-icon" title="수정" onClick={onEditStart}>
                                <Edit3 size={14} />
                            </button>
                        )
                    ) : (
                        <>
                            <button className="btn-icon btn-save" title="저장" onClick={onEditSave}>
                                <Check size={14} />
                            </button>
                            <button className="btn-icon btn-cancel" title="취소" onClick={onEditCancel}>
                                <X size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-fields">
                <DetailField
                    label="전화번호"
                    value={editMode ? editForm.phone ?? "" : formatPhoneNumber(selectedCustomer.phone)}
                    editMode={editMode}
                    onChange={v => setEditForm(p => ({ ...p, phone: formatPhoneNumber(v) }))}
                />
                <DetailField
                    label="이메일"
                    value={editMode ? editForm.email ?? "" : selectedCustomer.email ?? ""}
                    editMode={editMode}
                    onChange={v => setEditForm(p => ({ ...p, email: v }))}
                />
                <div className="detail-field-row">
                    <span className="detail-field-label">회사</span>
                    {editMode ? (
                        <select
                            className="detail-field-select"
                            value={editForm.company_id ?? ""}
                            onChange={e => setEditForm(p => ({ ...p, company_id: e.target.value ? Number(e.target.value) : null }))}
                            disabled={!isSystemAdmin}
                        >
                            <option value="">선택 안함</option>
                            {companies.filter(c => c.active).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="detail-field-value">{selectedCustomer.company_name || "-"}</span>
                    )}
                </div>
                {editMode && (
                    <div className="detail-field-row">
                        <span className="detail-field-label">그룹</span>
                        <select
                            className="detail-field-select"
                            value={editForm.group ?? "normal"}
                            onChange={e => setEditForm(p => ({ ...p, group: e.target.value }))}
                        >
                            {groups.filter(g => g.id !== "all").map(g => (
                                <option key={g.id} value={g.id}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="detail-field-row detail-field-memo">
                    <span className="detail-field-label">메모</span>
                    {editMode ? (
                        <textarea
                            className="detail-field-textarea"
                            value={editForm.memo ?? ""}
                            onChange={e => setEditForm(p => ({ ...p, memo: e.target.value }))}
                            rows={3}
                        />
                    ) : (
                        <span className="detail-field-value">{selectedCustomer.memo || "-"}</span>
                    )}
                </div>
                <div className="detail-field-row">
                    <span className="detail-field-label">등록일</span>
                    <span className="detail-field-value">{formatDateTime(selectedCustomer.created_at)}</span>
                </div>
            </div>

            <h4 className="detail-sub-title">통화 이력</h4>
            <div className="call-history-list">
                {calls.map(call => (
                    <div key={call.id} className="call-history-item">
                        <span className={`call-dir-badge ${call.direction === "inbound" ? "dir-in" : "dir-out"}`}>
                            {call.direction === "inbound" ? "수신" : "발신"}
                        </span>
                        <span className="call-date">{formatDateTime(call.date)}</span>
                        <span className="call-duration">{call.duration}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
