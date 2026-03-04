"use client";

import { Phone } from "lucide-react";
import { formatDateOnly, formatTimeOnly, calcDuration } from "@/lib/utils/date";
import type { CallRecord } from "@/lib/api/calls";

interface HistoryListProps {
    loading: boolean;
    error: string | null;
    filtered: CallRecord[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    directionLabel: (d: string) => string;
    directionClass: (d: string) => string;
    statusLabel: (s: string) => string;
    statusClass: (s: string) => string;
}

export default function HistoryList({
    loading, error, filtered, selectedId, onSelect,
    directionLabel, directionClass, statusLabel, statusClass,
}: HistoryListProps) {
    return (
        <section className="history-col history-col-list">
            <div className="list-header">
                <h3 className="history-section-title">통화 목록</h3>
                {!loading && !error && (
                    <span className="list-count">{filtered.length}건</span>
                )}
            </div>

            {loading ? (
                <div className="history-empty"><p>불러오는 중...</p></div>
            ) : error ? (
                <div className="history-empty history-error"><p>{error}</p></div>
            ) : filtered.length === 0 ? (
                <div className="history-empty">
                    <Phone size={32} strokeWidth={1.5} />
                    <p>조회된 통화 기록이 없습니다.</p>
                </div>
            ) : (
                <div className="call-table-wrap">
                    <table className="call-table">
                        <thead>
                            <tr>
                                <th>날짜/시간</th>
                                <th>발신번호</th>
                                <th>수신번호</th>
                                <th>방향</th>
                                <th>통화시간</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(call => (
                                <tr
                                    key={call.id}
                                    className={`call-row ${selectedId === call.id ? "selected" : ""}`}
                                    onClick={() => onSelect(call.id)}
                                >
                                    <td>
                                        <div className="cell-datetime">
                                            <span className="cell-date">{formatDateOnly(call.started_at ?? call.created_at)}</span>
                                            <span className="cell-time">{formatTimeOnly(call.started_at ?? call.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="cell-exten">{call.caller_exten ?? "-"}</td>
                                    <td className="cell-exten">{call.callee_exten ?? "-"}</td>
                                    <td>
                                        <span className={`dir-badge ${directionClass(call.direction)}`}>
                                            {directionLabel(call.direction)}
                                        </span>
                                    </td>
                                    <td className="cell-duration">
                                        {calcDuration(call.answered_at, call.ended_at)}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${statusClass(call.status)}`}>
                                            {statusLabel(call.status)}
                                        </span>
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
