"use client";

import { FileText, BookOpen, PhoneOff, Clock } from "lucide-react";
import { formatTimer } from "@/lib/utils/date";
import type { WaitingCall } from "@/hooks/useConsultData";

interface ConsultWorkProps {
    selectedCall: WaitingCall | null;
    activeTab: "memo" | "script";
    setActiveTab: (tab: "memo" | "script") => void;
    memo: string;
    setMemo: (v: string) => void;
    callTimer: number;
    onEndCall: () => void;
}

export default function ConsultWork({
    selectedCall, activeTab, setActiveTab, memo, setMemo, callTimer, onEndCall,
}: ConsultWorkProps) {
    return (
        <section className="consult-col col-center-work">
            {!selectedCall ? (
                <div className="consult-empty-state">
                    <FileText size={40} strokeWidth={1.5} />
                    <p>인입 목록에서 통화를 선택하세요</p>
                </div>
            ) : (
                <>
                    <div className="call-info-bar">
                        <div className="call-info-left">
                            <span className="call-stauts-dot blink" />
                            <div>
                                <p className="call-number">{selectedCall.callerNumber}</p>
                                <p className="call-queue-label">{selectedCall.queueName}</p>
                            </div>
                        </div>
                        <div className="call-timer">
                            <Clock size={14} />
                            {formatTimer(callTimer)}
                        </div>
                        <button className="btn-end-call" onClick={onEndCall}>
                            <PhoneOff size={14}/>
                            통화 종료
                        </button>
                    </div>

                    <div className="consult-tab">
                        <button
                            className={`consult-tab ${activeTab === "memo" ? "active" : ""}`}
                            onClick={() => setActiveTab("memo")}
                        >
                            <FileText size={13} /> 메모
                        </button>
                        <button
                            className={`consult-tab ${activeTab === "script" ? "active": ""}`}
                            onClick={() => setActiveTab("script")}
                        >
                            <BookOpen size={13}/> 스크립트
                        </button>
                    </div>

                    <div className="consult-tab-content">
                        {activeTab === "memo" ? (
                            <div className="memo-area">
                                <textarea
                                    className="memo-textarea"
                                    placeholder="상담 내용을 입력하세요..."
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                >
                                <div className="memo-footer">
                                    <span className="memo-char-count">{memo.length}자</span>
                                    <button className="btn-save-memo" disabled={!memo.trim()}>저장</button>
                                </div>
                                </textarea>
                            </div>
                        ) : (
                            <div className="consult-empty-state">
                                    <BookOpen size={32} strokeWidth={1.5} />
                                    <p>등록된 스크립트가 없습니다.</p>
                                </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}