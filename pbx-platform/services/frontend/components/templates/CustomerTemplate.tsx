"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Phone, User, Edit3, Trash2, X, Check, Users } from "lucide-react";
import { formatDateOnly, formatDateTime } from "@/lib/utils/date";
import "@/styles/templates/customer.css";

// -- 타입 --
interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    group: string;
    memo: string;
    createdAt: string;
    lastCallAt: string | null;
}

interface CustomerGroup {
    id: string;
    label: string;
    color: string;
}

interface CallHistory {
    id: string;
    date: string;
    direction: string;
    duration: string;
}


// -- MOCK DATA --
const GROUPS: CustomerGroup[] = [
    { id: "all", label: "전체", color: "#6b7280" },
    { id: "vip", label: "VIP", color: "#f59e0b" },
    { id: "normal", label: "일반", color: "#3b82f6" },
    { id: "blacklist", label: "블랙리스트", color: "#ef4444" },
]

const MOCK_CUSTOMERS: Customer[] = [
    { id: "1", name: "김민수", phone: "010-1234-5678", email: "minsu@example.com",  company: "테스트 주식회사", group: "vip",       memo: "VIP 우대 고객",        createdAt: "2025-01-15", lastCallAt: "2026-02-20T10:30:00" },
    { id: "2", name: "이영희", phone: "010-9876-5432", email: "young@gmail.com",    company: "서울 컨설팅",   group: "normal",    memo: "",                    createdAt: "2025-03-22", lastCallAt: "2026-02-18T14:20:00" },
    { id: "3", name: "박철수", phone: "02-1234-5678",  email: "chul@company.co.kr", company: "글로벌 무역",   group: "normal",    memo: "정기 AS 고객",        createdAt: "2025-05-10", lastCallAt: "2026-01-30T09:15:00" },
    { id: "4", name: "최수진", phone: "010-5555-7777", email: "sujin@example.com",  company: "스마트 솔루션", group: "vip",       memo: "월 평균 통화 30회 이상", createdAt: "2024-11-05", lastCallAt: "2026-02-25T16:45:00" },
    { id: "5", name: "정대한", phone: "031-888-9999",  email: "",                   company: "",              group: "blacklist", memo: "스팸 발신 이력",       createdAt: "2026-01-08", lastCallAt: "2026-02-10T11:00:00" },
    { id: "6", name: "윤미래", phone: "010-2222-3333", email: "mirae@tech.com",     company: "미래 기술",     group: "normal",    memo: "",                    createdAt: "2025-08-20", lastCallAt: "2026-02-22T13:30:00" },
    { id: "7", name: "강동원", phone: "010-4444-8888", email: "dongwon@biz.com",    company: "강동 물산",     group: "vip",       memo: "기업 계약 고객",       createdAt: "2024-09-12", lastCallAt: "2026-02-24T10:00:00" },
];

const MOCK_CALLS: CallHistory[] = [
    { id: "1", date: "2026-02-20T10:30:00", direction: "inbound",  duration: "5분 23초" },
    { id: "2", date: "2026-02-15T14:20:00", direction: "outbound", duration: "2분 10초" },
    { id: "3", date: "2026-02-10T09:00:00", direction: "inbound",  duration: "0초"      },
];

// -- 유틸 --
function groupLabel(id: string) { return GROUPS.find(g => g.id === id)?.label ?? id; }
function groupColor(id: string) { return GROUPS.find(g => g.id === id)?.color ?? "#6b7280"; }

const DEFAULT_NEW: Partial<Customer> = { name: "", phone: "", email: "", company: "", group: "normal", memo: "" };

// -- 컴포넌트 --
export default function CustomerTemplate() {
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newForm, setNewForm] = useState<Partial<Customer>>(DEFAULT_NEW);

    const groupCounts = useMemo(() => {
        const counts: Record<string, number> = { all: customers.length };
        customers.forEach(c => { counts[c.group] = (counts[c.group] || 0) + 1; });
        return counts;
    }, [customers]);

    const filtered = useMemo(() => {
        return customers.filter(c => {
            if (selectedGroup !== "all" && c.group !== selectedGroup) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !c.name.toLowerCase().includes(q) &&
                    !c.phone.toLowerCase().includes(q) &&
                    !c.company.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [customers, selectedGroup, search]);

    const selectedCustomer = customers.find(c => c.id === selectedId) ?? null;

    // -- 핸들러 --
    function handleSelect(id: string) {
        setSelectedId(id);
        setEditMode(false);
    }

    function handleEditStart() {
        if (!selectedCustomer) return;
        setEditForm({ ...selectedCustomer });
        setEditMode(true);
    }

    function handleEditCancel() {
        setEditMode(false);
        setEditForm({});
    }

    function handleEditSave() {
        if (!selectedCustomer) return;
        setCustomers(prev =>
            prev.map(c => c.id === selectedCustomer.id ? { ...c, ...editForm} as Customer : c)
        );
        setEditMode(false);
        setEditForm({});
    }

    function handleDelete() {
        if (!selectedCustomer) return;
        setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
        setSelectedId(null);
    }

    function handleAddOpen() {
        setNewForm(DEFAULT_NEW);
        setShowAddModal(true);
    }

    function handleAddSave() {
        if (!newForm.name || !newForm.phone) return;
        const id = String(Date.now());
        setCustomers(prev => [...prev, {
            id,
            name: newForm.name!,
            phone: newForm.phone!,
            email: newForm.email ?? "",
            company: newForm.company ?? "",
            group: newForm.group ?? "normal",
            memo: newForm.memo ?? "",
            createdAt: new Date().toISOString().slice(0, 10),
            lastCallAt: null,
        }]);
        setShowAddModal(false);
    }

    return (
        <div className="customer-container">
            {/* -- 좌측: 그룹 -- */}
            <section className="customer-col customer-col-groups">
                <h3 className="customer-title">
                    <Users size={15} style={{marginRight: 6, verticalAlign: "middle"}} />
                    그룹
                </h3>
                <ul className="group-list">
                    {GROUPS.map(g => (
                        <li
                            key={g.id}
                            className={`group-item ${selectedGroup === g.id ? "active" : ""}`}
                            onClick={() => {setSelectedGroup(g.id); setSelectedId(null);}}
                        >
                            <span className="group-dot" style={{ background: g.color }}/>
                            <span className="group-label">{g.label}</span>
                            <span className="group-count">{groupCounts[g.id] ?? 0}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* -- 중앙: 고객 목록 -- */}
            <section className="customer-col customer-col-list">
                <div className="list-toolbar">
                    <h3 className="customer-title" style={{ margin: 0 }}>고객 목록</h3>
                    <div className="list-toolbar-right">
                        <div className="search-warp">
                            <Search size={13} className="search-icon" />
                            <input 
                                type="text"
                                className="search-input"
                                placeholder="이름, 전화번호, 회사"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={handleAddOpen}>
                            <Plus size={14} />
                            추가
                        </button>
                    </div>
                </div>

                <div className="list-count-row">
                    <span className="list-count">{filtered.length}명</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="customer-empty">
                        <User size={32} strokeWidth={1.5}/>
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
                                        onClick={() => handleSelect(c.id)}
                                    >
                                        <td className="cell-name">{c.name}</td>
                                        <td className="cell-phone">
                                            <Phone size={11} className="cell-phone-icon" />
                                            {c.phone}
                                        </td>
                                        <td className="cell-company">{c.company || "-"}</td>
                                        <td>
                                            <span
                                                className="group-badge"
                                                style={{ background: groupColor(c.group) + "22", color: groupColor(c.group) }}
                                            >
                                                {groupLabel(c.group)}
                                            </span>
                                        </td>
                                        <td className="cell-date">{formatDateOnly(c.lastCallAt)}</td>
                                        <td className="cell-actions" onClick={e => e.stopPropagation()}>
                                            <button className="btn-icon" title="삭제" onClick={handleDelete}>
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* -- 우측: 상세 정보 -- */}
            <section className="customer-col customer-col-detail">
                {!selectedCustomer ? (
                    <div className="customer-empty">
                        <User size={36} strokeWidth={1.5} />
                        <p>고객을 선택하면<br />상세 정보가 표시됩니다.</p>
                    </div>
                ) : (
                    <>
                        <div className="detail-header">
                            <div className="detail-name-wrap">
                                <span className="detail-name">{selectedCustomer.name}</span>
                                <span
                                    className="group-badge"
                                    style={{ background: groupColor(selectedCustomer.group) + "22", color: groupColor(selectedCustomer.group) }}
                                >
                                    {groupLabel(selectedCustomer.group)}
                                </span>
                            </div>
                            <div className="detail-actions">
                                {!editMode ? (
                                    <button className="btn-icon" title="수정" onClick={handleEditStart}>
                                        <Edit3 size={14} />
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn-icon btn-save" title="저장" onClick={handleEditSave}>
                                            <Check size={14} />
                                        </button>
                                        <button className="btn-icon btn-cancel" title="취소" onClick={handleEditCancel}>
                                            <X size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="detail-fields">
                            <DetailField label="전화번호" value={editMode ? editForm.phone ?? "" : selectedCustomer.phone}
                                editMode={editMode} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
                            <DetailField label="이메일" value={editMode ? editForm.email ?? "" : selectedCustomer.email}
                                editMode={editMode} onChange={v => setEditForm(p => ({ ...p, email: v }))} />
                            <DetailField label="회사" value={editMode ? editForm.company ?? "" : selectedCustomer.company}
                                editMode={editMode} onChange={v => setEditForm(p => ({ ...p, company: v }))} />
                            {editMode && (
                                <div className="detail-field-row">
                                    <span className="detail-field-label">그룹</span>
                                    <select className="detail-field-select"
                                        value={editForm.group ?? "normal"}
                                        onChange={e => setEditForm(p => ({ ...p, group: e.target.value }))}>
                                        {GROUPS.filter(g => g.id !== "all").map(g => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="detail-field-row detail-field-memo">
                                <span className="detail-field-label">메모</span>
                                {editMode ? (
                                    <textarea className="detail-field-textarea"
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
                                <span className="detail-field-value">{selectedCustomer.createdAt}</span>
                            </div>
                        </div>

                        <h4 className="detail-sub-title">통화 이력</h4>
                        <div className="call-history-list">
                            {MOCK_CALLS.map(call => (
                                <div key={call.id} className="call-history-item">
                                    <span className={`call-dir-badge ${call.direction === "inbound" ? "dir-in" : "dir-out"}`}>
                                        {call.direction === "inbound" ? "수신" : "발신"}
                                    </span>
                                    <span className="call-date">{formatDateTime(call.date)}</span>
                                    <span className="call-duration">{call.duration}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* -- 고객 추가 모달 -- */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">고객 추가</span>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <ModalField label="이름 *" value={newForm.name ?? ""} onChange={v => setNewForm(p => ({ ...p, name: v }))} placeholder="홍길동" />
                            <ModalField label="전화번호 *" value={newForm.phone ?? ""} onChange={v => setNewForm(p => ({ ...p, phone: v }))} placeholder="010-0000-0000" />
                            <ModalField label="이메일" value={newForm.email ?? ""} onChange={v => setNewForm(p => ({ ...p, email: v }))} placeholder="email@example.com" />
                            <ModalField label="회사" value={newForm.company ?? ""} onChange={v => setNewForm(p => ({ ...p, company: v }))} placeholder="회사명" />
                            <div className="modal-field-row">
                                <label className="modal-field-label">그룹</label>
                                <select className="modal-field-input"
                                    value={newForm.group ?? "normal"}
                                    onChange={e => setNewForm(p => ({ ...p, group: e.target.value }))}>
                                    {GROUPS.filter(g => g.id !== "all").map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-field-row">
                                <label className="modal-field-label">메모</label>
                                <textarea className="modal-field-input"
                                    value={newForm.memo ?? ""}
                                    onChange={e => setNewForm(p => ({ ...p, memo: e.target.value }))}
                                    rows={3} placeholder="메모 입력"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>취소</button>
                            <button className="btn-modal-save" onClick={handleAddSave}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// -- 서브 컴포넌트 --
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