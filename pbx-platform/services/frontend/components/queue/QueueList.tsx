"use client";

import { useState } from "react";
import type { Queue, QueueCreate } from "@/types/queue";
import type { Company } from "@/types/company";

interface Props {
    queues: Queue[];
    selectedQueue: Queue | null;
    onSelect: (queue: Queue) => void;
    onCreate: (data: QueueCreate) => void;
    onDelete: (queueId: number) => void;
    onToggleActive: (queueId: number, isActive: boolean) => void;
    companyId: number | null;
    isSystemAdmin: boolean;
    companies: Company[];
    filterCompanyId: number | null;
    onFilterCompanyChange: (id: number | null) => void;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export default function QueueList({
    queues, selectedQueue, onSelect, onCreate, onDelete, onToggleActive,
    companyId, isSystemAdmin, companies, filterCompanyId, onFilterCompanyChange,
    canCreate, canUpdate, canDelete, 
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");

    const handleCreate = () => {
        if (!newName.trim()) return;
        onCreate({ name: newName.trim(), company_id: filterCompanyId ?? undefined });
        setNewName("");
        setShowCreate(false);
    };

    return (
        <div className="queue-list">
            <div className="queue-panel-title">큐 목록</div>

            {isSystemAdmin && (
                <div className="queue-company-select-wrap">
                    <select
                        className="queue-company-select"
                        value={filterCompanyId ?? ""}
                        onChange={e => onFilterCompanyChange(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">전체 업체</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="queue-section">
                <div className="queue-section-header">
                    <span className="queue-section-label">큐</span>
                    {canCreate && (
                        <button className="btn-queue-add" onClick={() => setShowCreate(v => !v)}>+</button>
                    )}
                </div>

                {showCreate && (
                    <div className="queue-create-row">
                        <input 
                            className="queue-name-input"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            placeholder="큐 이름"
                            autoFocus    
                        />
                        <button className="btn-queue-confirm" onClick={handleCreate}>추가</button>
                        <button className="btn-queue-cancel" onClick={() => { setShowCreate(false); setNewName(""); }}>✕</button>
                    </div>
                )}

                {queues.length === 0 && (
                    <div className="queue-empty-hint">큐가 없습니다.</div>
                )}

                {queues.map(queue => (
                    <div
                        key={queue.id}
                        className={`queue-item${selectedQueue?.id === queue.id ? " active" : ""}`}
                        onClick={() => onSelect(queue)}
                    >
                        <span className={`queue-active-dot ${queue.is_active ? "on" : "off"}`} />
                        <span className="queue-item-name">{queue.name}</span>
                        <div className="queue-item-actions">
                            {canUpdate && (
                                <button
                                    className="btn-queue-icon"
                                    title={queue.is_active ? "비활성화" : "활성화"}
                                    onClick={e => { e.stopPropagation(); onToggleActive(queue.id, !queue.is_active); }}
                                >
                                    {queue.is_active ? "🔴" : "🟢"}
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    className="btn-queue-icon btn-danger"
                                    title="삭제"
                                    onClick={e => { e.stopPropagation(); onDelete(queue.id); }}
                                >
                                    🗑
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}