"use client";

import { useState } from "react";
import type { Queue, QueueMember, QueueMemberCreate } from "@/types/queue";

interface Props {
    queue: Queue;
    onAdd: (queueId: number, data: QueueMemberCreate) => void;
    onRemove: (memberId: number) => void;
    onTogglePause: (memberId: number, paused: boolean) => void;
    canUpdate: boolean;
}

export default function QueueMemberList({ queue, onAdd, onRemove, onTogglePause, canUpdate }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [iface, setIface] = useState("");
    const [membername, setMembername] = useState("");
    const [penalty, setPenalty] = useState(0);

    const handleAdd = () => {
        if (!iface.trim()) return;
        onAdd(queue.id, {
            interface: iface.trim(),
            membername: membername.trim() || undefined,
            penalty,
        });
        setIface("");
        setMembername("");
        setPenalty(0);
        setShowAdd(false);
    };

    return (
        <div className="queue-member-section">
            <div className="queue-member-header">
                <span className="queue-editor-title">멤버 관리</span>
                {canUpdate && (
                    <button className="btn-queue-add" onClick={() => setShowAdd(v => !v)}>+</button>
                )}
            </div>

            {showAdd && (
                <div className="queue-member-add-form">
                    <input
                        className="queue-field-input"
                        value={iface}
                        onChange={e => setIface(e.target.value)}
                        placeholder="내선 (예: SIP/1001)"
                        autoFocus
                    />
                    <input
                        className="queue-field-input"
                        value={membername}
                        onChange={e => setMembername(e.target.value)}
                        placeholder="이름 (선택)"
                    />
                    <div className="queue-field-row">
                        <div className="queue-field-group">
                            <label className="queue-field-label">우선순위 (penalty)</label>
                            <input
                                className="queue-field-input"
                                type="number"
                                min={0}
                                value={penalty}
                                onChange={e => setPenalty(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button className="btn-queue-cancel" onClick={() => setShowAdd(false)}></button>
                        <button className="btn-queue-confirm" onClick={handleAdd}>추가</button>
                    </div>
                </div>
            )}

            {queue.members.length === 0 ? (
                <div className="queue-empty-hint">멤버가 없습니다.</div>
            ) : (
                <table className="queue-member-table">
                    <thead>
                        <tr>
                            <th>내선</th>
                            <th>이름</th>
                            <th>우선순위</th>
                            <th>상태</th>
                            {canUpdate && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {queue.members.map((m: QueueMember) => (
                            <tr key={m.id}>
                                <td>{m.interface}</td>
                                <td>{m.membername || "-"}</td>
                                <td>{m.penalty}</td>
                                <td>
                                    {canUpdate ? (
                                        <button
                                            className={`btn-queue-pause ${m.paused? "paused" : "active"}`}
                                            onClick={() => onTogglePause(m.id, !m.paused)}
                                        >
                                            {m.paused ? "일시정지" : "활성"}
                                        </button>
                                    ) : (
                                        <span className={`queue-status-badge ${m.paused ? "paused" : "active"}`}>
                                            {m.paused ? "일시정지" : "활성"}
                                        </span>
                                    )}
                                </td>
                                {canUpdate && (
                                    <td>
                                        <button
                                            className="btn-queue-icon btn-danger"
                                            onClick={() => onRemove(m.id)}
                                        >
                                            🗑
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}