"use client";

import { useState, useEffect, useRef } from "react";
import { fetchUsers } from "@/lib/api/users";
import type { User } from "@/types/user";
import type { Queue, QueueMember, QueueMemberCreate } from "@/types/queue";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/common/Pagination";
import "@/styles/common/modal.css";
import styles from "@/styles/components/QueueUserSelect.module.css";

interface Props {
    queue: Queue;
    token: string;
    onAdd: (queueId: number, data: QueueMemberCreate) => void;
    onRemove: (memberId: number) => void;
    onTogglePause: (memberId: number, paused: boolean) => void;
    canUpdate: boolean;
}

export default function QueueMemberList({ queue, token, onAdd, onRemove, onTogglePause, canUpdate }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [iface, setIface] = useState("");
    const [membername, setMembername] = useState("");
    const [penalty, setPenalty] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { page, setPage, pageSize, setPageSize, totalPages, paged } = usePagination(queue.members, 5);

    useEffect(() => {
        if (!showModal || !queue.company_id) return;
        fetchUsers(token, queue.company_id).then(setUsers).catch(() => {});
    }, [showModal, token, queue.company_id]);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleUserSelect = (userId: number | "") => {
        setSelectedUserId(userId);
        setDropdownOpen(false);
        if (userId === "") {
            setIface("");
            setMembername("");
            return;
        }
        const user = users.find(u => u.id === userId);
        if (!user) return;
        setIface(user.extension ? `SIP/${user.extension}` : "");
        setMembername(user.name);
    };

    const handleAdd = () => {
        if (!iface.trim()) return;
        onAdd(queue.id, {
            user_id: selectedUserId !== "" ? selectedUserId : undefined,
            interface: iface.trim(),
            membername: membername.trim() || undefined,
            penalty,
        });
        handleClose();
    };

    const handleClose = () => {
        setShowModal(false);
        setDropdownOpen(false);
        setSelectedUserId("");
        setIface("");
        setMembername("");
        setPenalty(0);
    };

    const existingUserIds = new Set(queue.members.map(m => m.user_id).filter(Boolean));
    const selectedUser = users.find(u => u.id === selectedUserId);

    const roleLabel = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return { label: "시스템 관리자", cls: styles.roleAdmin };
            case "MANAGER":      return { label: "업체 관리자", cls: styles.roleManager };
            case "AGENT":        return { label: "상담원", cls: styles.roleAgent };
            default:             return { label: role,     cls: styles.badgeGray };
        }
    };

    return (
        <div className="queue-member-section">
            <div className="queue-member-header">
                <span className="queue-editor-title">멤버 관리</span>
                {canUpdate && (
                    <button className="btn-queue-add" onClick={() => setShowModal(true)}>+</button>
                )}
            </div>

            {showModal && (
                <>
                    <div className="modal-overlay" onClick={handleClose} />
                    <div className="modal-content" style={{ width: 420 }}>
                        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3>멤버 추가</h3>
                            <button
                                onClick={handleClose}
                                style={{ background: "none", border: "none", fontSize: 18, color: "#8b95a1", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}
                            >✕</button>
                        </div>

                        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {queue.company_id ? (
                                <div className="queue-field-group">
                                    <label className="queue-field-label">사용자 선택</label>
                                    <div className={styles.dropdown} ref={dropdownRef}>
                                        <button
                                            type="button"
                                            className={styles.trigger}
                                            onClick={() => setDropdownOpen(v => !v)}
                                        >
                                            {selectedUser ? (
                                                <span className={styles.triggerItem}>
                                                    <span className={`${styles.dot} ${selectedUser.is_active ? styles.dotActive : styles.dotInactive}`} />
                                                    <span className={styles.userName}>{selectedUser.name}</span>
                                                    {selectedUser.extension && <span className={styles.exten}>({selectedUser.extension})</span>}
                                                    <span className={`${styles.badge} ${roleLabel(selectedUser.role).cls}`}>{roleLabel(selectedUser.role).label}</span>
                                                    {!selectedUser.is_active && <span className={styles.badge}>비활성</span>}
                                                </span>
                                            ) : (
                                                <span className={styles.placeholder}>직접 입력</span>
                                            )}
                                            <span className={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</span>
                                        </button>

                                        {dropdownOpen && (
                                            <ul className={styles.list}>
                                                <li
                                                    className={`${styles.item} ${selectedUserId === "" ? styles.itemSelected : ""}`}
                                                    onClick={() => handleUserSelect("")}
                                                >
                                                    <span className={styles.placeholder}>직접 입력</span>
                                                </li>
                                                {users.filter(u => u.role !== "SYSTEM_ADMIN").map(u => {
                                                    const already = existingUserIds.has(u.id);
                                                    return (
                                                        <li
                                                            key={u.id}
                                                            className={`${styles.item} ${already ? styles.itemDisabled : ""} ${selectedUserId === u.id ? styles.itemSelected : ""}`}
                                                            onClick={() => !already && handleUserSelect(u.id)}
                                                        >
                                                            <span className={`${styles.dot} ${u.is_active ? styles.dotActive : styles.dotInactive}`} />
                                                            <span className={styles.userName}>{u.name}</span>
                                                            {u.extension && <span className={styles.exten}>({u.extension})</span>}
                                                            <span className={`${styles.badge} ${roleLabel(u.role).cls}`}>{roleLabel(u.role).label}</span>
                                                            {!u.is_active && <span className={styles.badge}>비활성</span>}
                                                            {already && <span className={`${styles.badge} ${styles.badgeGray}`}>이미 추가됨</span>}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="queue-field-group">
                                <label className="queue-field-label">
                                    내선 <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    className="queue-field-input"
                                    value={iface}
                                    onChange={e => setIface(e.target.value)}
                                    placeholder="예: SIP/1001"
                                />
                            </div>

                            <div className="queue-field-group">
                                <label className="queue-field-label">표시 이름</label>
                                <input
                                    className="queue-field-input"
                                    value={membername}
                                    onChange={e => setMembername(e.target.value)}
                                    placeholder="이름 (선택)"
                                />
                            </div>

                            <div className="queue-field-group">
                                <label className="queue-field-label">우선순위 (penalty)</label>
                                <input
                                    className="queue-field-input"
                                    type="number"
                                    min={0}
                                    value={penalty}
                                    onChange={e => setPenalty(Number(e.target.value))}
                                />
                                <span style={{ fontSize: 11, color: "#8b95a1", marginTop: 3, display: "block" }}>
                                    낮을수록 먼저 연결됩니다 (0 = 최우선)
                                </span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-ghost" onClick={handleClose}>취소</button>
                            <button
                                className="btn-primary"
                                onClick={handleAdd}
                                disabled={!iface.trim()}
                                style={{ opacity: iface.trim() ? 1 : 0.5, cursor: iface.trim() ? "pointer" : "not-allowed" }}
                            >
                                추가
                            </button>
                        </div>
                    </div>
                </>
            )}

            {queue.members.length === 0 ? (
                <div className="queue-empty-hint">멤버가 없습니다.</div>
            ) : (
                <>
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
                            {paged.map((m: QueueMember) => (
                                <tr key={m.id}>
                                    <td>{m.interface}</td>
                                    <td>{m.membername || "-"}</td>
                                    <td>{m.penalty}</td>
                                    <td>
                                        {canUpdate ? (
                                            <button
                                                className={`btn-queue-pause ${m.paused ? "paused" : "active"}`}
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
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                </>
            )}
        </div>
    );
}
