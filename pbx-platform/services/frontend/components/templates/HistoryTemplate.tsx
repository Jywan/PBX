"use client";

import { useEffect, useState, useMemo } from "react";
import { Phone, PhoneOff, Search, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCalls, CallRecord } from "@/lib/api/calls";
import { formatDateTime, formatDateOnly, formatTimeOnly, calcDuration } from "@/lib/utils/date";
import "@/styles/templates/history.css";

const DIRECTION_MAP: Record<string, string> = {
    internal: "내선",
    inbound: "인바운드",
    outbound: "아웃바운드"
}

const STATIS_MAP: Record<string, string> = {
    ended: "종료",
    up: "통화중",
    new: "대기",
}

function directionLabel(d: string) { return DIRECTION_MAP[d] ?? d; }
function statusLabel(s: string) { return STATIS_MAP[s] ?? s; }
function statusClass(s: string) {
    if (s === "ended") return "status-ended";
    if (s === "up") return "status-up";
    return "status-new";
}
function directionClass(d: string) {
    if (d === "inbound") return "dir-inbound";
    if (d === "outbound") return "dir-outbound";
    return "dir-internal";
}

// -- 컴포넌트 --
interface FilterState {
    dateFrom: string;
    dateTo: string;
    direction: string;
    status: string;
    search: string;
}

const defaultFilter: FilterState = {
    dateFrom: "",
    dateTo: "",
    direction: "",
    status: "",
    search: ""
}

export default function HistoryTemplate() {
    const { token, isLoading: authLoading } = useAuth();
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterState>(defaultFilter);
    const [applied, setApplied] = useState<FilterState>(defaultFilter);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !token) return;

        fetchCalls(token)
            .then(data => setCalls(data))
            .catch(e => setError("데이터 로드 실패: " + (e?.message ?? "unknown")))
            .finally(() => setLoading(false));
    }, [token, authLoading]);

    const filtered = useMemo(() => {
        return calls.filter(c => {
            const dt = c.started_at ?? c.created_at;
            if (applied.dateFrom && new Date(dt) < new Date(applied.dateFrom + "T00:00:00")) return false;
            if (applied.dateTo && new Date(dt) > new Date(applied.dateTo + "T23:59:59")) return false;
            if (applied.direction && c.direction !== applied.direction) return false;
            if (applied.status && c.status !== applied.status) return false;
            if (applied.search) {
                const q = applied.search.toLowerCase();
                const caller = (c.caller_exten ?? "").toLowerCase();
                const callee = (c.callee_exten ?? "").toLowerCase();
                if (!caller.includes(q) && !callee.includes(q)) return false;
            }
            return true;
        });
    }, [calls, applied]);

    const selectedCall = filtered.find(c => c.id === selectedId) ?? null;

    const handleApply = () => { setApplied(filter); setSelectedId(null); };
    const handleReset = () => { setFilter(defaultFilter); setApplied(defaultFilter); setSelectedId(null); };

    return (
        <div className="history-container">
            {/* -- 좌측: 조회 조건 -- */}
            <section className="history-col history-col-filter">
                <h3 className="history-section-title">조회 조건</h3>
                
                <div className="filter-group">
                    <label className="filter-label">기간</label>
                    <input type="date" className="filter-input"
                        value={filter.dateFrom}
                        onChange={e => setFilter(p => ({ ...p, dateFrom: e.target.value }))}
                    />
                    <span className="filter-range-sep">~</span>
                    <input type="date" className="filter-input"
                        value={filter.dateTo}
                        onChange={e => setFilter(p => ({ ...p, dateTo: e.target.value }))}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">방향</label>
                    <select className="filter-select"
                        value={filter.direction}
                        onChange={e => setFilter(p => ({ ...p, direction: e.target.value }))}
                    >
                        <option value="">전체</option>
                        <option value="internal">내선</option>
                        <option value="inbound">인바운드</option>
                        <option value="outbound">아웃바운드</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">상태</label>
                    <select className="filter-select"
                        value={filter.status}
                        onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}
                    >
                        <option value="">전체</option>
                        <option value="ended">종료</option>
                        <option value="up">통화중</option>
                        <option value="new">대기</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">번호 검색</label>
                    <div className="filter-search-wrap">
                        <Search size={13} className="filter-search-icon" />
                        <input 
                            type="text"
                            className="filter-input filter-search-input"
                            placeholder="내선번호 입력"
                            value={filter.search}
                            onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleApply(); }}
                        />
                    </div>
                </div>

                <div className="filter-actions">
                    <button className="btn-filter-apply" onClick={handleApply}>조회</button>
                    <button className="btn-filter-reset" onClick={handleReset}>
                        <RotateCcw />초기화
                    </button>
                </div>
            </section>

            {/* -- 중앙: 통화 목록 -- */}
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
                                        onClick={() => setSelectedId(call.id)}
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
            
            {/* -- 우측: 상세 정보 -- */}
            <section className="history-col history-col-detail">
                {!selectedCall ? (
                    <div className="history-empty">
                        <PhoneOff size={36} strokeWidth={1.5} />
                        <p>통화를 선택하면<br />상세 내역이 표시됩니다.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="history-section-title">상세 내역</h3>
                        <div className="detail-call-header">
                            <span className="detail-exten">{selectedCall.caller_exten ?? "-"}</span>
                            <span className="detail-arrow">→</span>
                            <span className="detail-exten">{selectedCall.callee_exten ?? "-"}</span>
                        </div>
                        <div className="detail-badges">
                            <span className={`dir-badge ${directionClass(selectedCall.direction)}`}>
                                {directionLabel(selectedCall.direction)}
                            </span>
                            <span className={`status-badge ${statusClass(selectedCall.status)}`}>
                                {statusLabel(selectedCall.status)}
                            </span>
                        </div>

                        <div className="detail-timeline">
                            <div className="timeline-item">
                                <span className="timeline-dot dot-start" />
                                <div className="timeline-info">
                                    <span className="timeline-label">인입</span>
                                    <span className="timeline-value">{formatDateTime(selectedCall.started_at)}</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <span className="timeline-dot dot-answer" />
                                <div className="timeline-info">
                                    <span className="timeline-label">응답</span>
                                    <span className="timeline-value">{formatDateTime(selectedCall.answered_at)}</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <span className="timeline-dot dot-end" />
                                <div className="timeline-info">
                                    <span className="timeline-label">종료</span>
                                    <span className="timeline-value">{formatDateTime(selectedCall.ended_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-meta">
                            <div className="detail-meta-row">
                                <span className="detail-meta-label">통화시간</span>
                                <span className="detail-meta-value">
                                    {calcDuration(selectedCall.answered_at, selectedCall.ended_at)}
                                </span>
                            </div>
                            {selectedCall.hangup_reason && (
                                <div className="detail-meta-row">
                                    <span className="detail-meta-label">종료 원인</span>
                                    <span className="detail-meta-value">
                                        {selectedCall.hangup_reason}
                                        {selectedCall.hangup_cause != null ? ` (${selectedCall.hangup_cause})` : ""}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}