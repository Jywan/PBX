"use client";

import { Search, Plus, Phone, User, Trash2 } from "lucide-react";
import { formatDateOnly } from "@/lib/utils/date";
import { formatPhoneNumber } from "@/lib/utils/validation";
import type { Customer } from "@/types/customer";
import type { Company } from "@/types/company";

interface CustomerListProps {
    filtered: Customer[];
    selectedId: number | null;
    search: string;
    onSearchChange: (v: string) => void;
    onSelect: (id: number) => void;
    onDelete: () => void;
    onAddOpen: () => void;
    getGroupLabel: (id: string) => string;
    getGroupColor: (id: string) => string;
    canCreate: boolean;
    canDelete: boolean;
    isSystemAdmin: boolean;
    companies: Company[];
    selectedCompanyId: number | null;
    onCompanyChange: (id: number | null) => void;
}

export default function CustomerList({
    filtered, selectedId, search,
    onSearchChange, onSelect, onDelete, onAddOpen,
    getGroupLabel, getGroupColor,
    canCreate, canDelete,
    isSystemAdmin, companies, selectedCompanyId, onCompanyChange,
}: CustomerListProps) {
    return (
        <section className="customer-col customer-col-list">
            <div className="list-toolbar">
                <h3 className="customer-title" style={{ margin: 0 }}>고객 목록</h3>
                <div className="list-toolbar-right">
                    {isSystemAdmin && (
                        <select
                            className="company-filter-select"
                            value={selectedCompanyId ?? ""}
                            onChange={e => onCompanyChange(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">전체 회사</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <div className="search-warp">
                        <Search size={13} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="이름, 전화번호"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                    {canCreate && (
                        <button className="btn-add" onClick={onAddOpen}>
                            <Plus size={14} />
                            추가
                        </button>
                    )}
                </div>
            </div>

            <div className="list-count-row">
                <span className="list-count">{filtered.length}명</span>
            </div>

            {filtered.length === 0 ? (
                <div className="customer-empty">
                    <User size={32} strokeWidth={1.5} />
                    <p>고객이 없습니다.</p>
                </div>
            ) : (
                <div className="customer-table-wrap">
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>전화번호</th>
                                <th>회사</th>
                                <th>그룹</th>
                                <th>최근 통화</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr
                                    key={c.id}
                                    className={`customer-row ${selectedId === c.id ? "selected" : ""}`}
                                    onClick={() => onSelect(c.id)}
                                >
                                    <td className="cell-name">{c.name}</td>
                                    <td>
                                        <span className="cell-phone">
                                            <Phone size={11} className="cell-phone-icon" />
                                            {formatPhoneNumber(c.phone)}
                                        </span>
                                    </td>
                                    <td className="cell-company">{c.company_name || "-"}</td>
                                    <td>
                                        <span
                                            className="group-badge"
                                            style={{ background: getGroupColor(c.group) + "22", color: getGroupColor(c.group) }}
                                        >
                                            {getGroupLabel(c.group)}
                                        </span>
                                    </td>
                                    <td className="cell-date">{formatDateOnly(c.last_call_at)}</td>
                                    <td className="cell-actions" onClick={e => e.stopPropagation()}>
                                        {canDelete && (
                                            <button className="btn-icon" title="삭제" onClick={onDelete}>
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
