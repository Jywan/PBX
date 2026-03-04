"use client";

import { PhoneOff } from "lucide-react";
import { formatDateTime, calcDuration } from "@/lib/utils/date";
import type { CallRecord } from "@/lib/api/calls";

interface HistoryDetailProps {
    selectedCall: CallRecord | null;
    directionLabel: (d: string) => string;
    directionClass: (d: string) => string;
    statusLabel: (s: string) => string;
    statusClass: (s: string) => string;
}

export default function HistoryDetail({
    selectedCall,
    directionLabel, directionClass, statusLabel, statusClass,
}: HistoryDetailProps) {
    return (
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
    );
}
