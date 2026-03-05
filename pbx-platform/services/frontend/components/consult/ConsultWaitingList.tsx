"use client";

import { Phone, Clock } from "lucide-react";
import { formatSeconds } from "@/lib/utils/date";
import type { WaitingCall } from "@/hooks/useConsultData";

interface ConsultWaitingListProps {
    waitingCalls: WaitingCall[];
    selectedCallId: string | null;
    onSelect: (id: string) => void;
}

export default function ConsultWaitingList({ waitingCalls, selectedCallId, onSelect }: ConsultWaitingListProps) {
    return (
        <section className="consult-col col-left-list">
            <div className="consult-col-header">
                <h3 className="consult-section-title">인입목록</h3>
                <span className="consult-badge">{waitingCalls.length}</span>
            </div>
            <div className="waiting-list">
                {waitingCalls.length === 0 ? (
                    <div className="consult-empty-state">
                        <Phone size={32} strokeWidth={1.5} />
                        <p>대기 중인 통화가 없습니다</p>
                    </div>
                ) : (
                    waitingCalls.map(call => (
                        <div
                            key={call.id}
                            className={`waiting-item ${selectedCallId === call.id ? "selected" : ""}`}
                            onClick={() => onSelect(call.id)}
                        >
                            <div className="waiting-item-top">
                                <span className="waiting-number">{call.callerNumber}</span>
                                {selectedCallId === call.id && <span className="waiting-active-dot" />}
                            </div>
                            <div className="waiting-item-bottom">
                                <span className="waiting-queue">{call.queueName}</span>
                                <span className="waiting-time">
                                    <Clock size={11}/>
                                    {formatSeconds(call.waitSeconds)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}