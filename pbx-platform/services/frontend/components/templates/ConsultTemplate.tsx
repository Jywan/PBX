'use client';

import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Clock, User, FileText, BookOpen } from "lucide-react";
import { formatSeconds, formatTimer } from "@/lib/utils/date";
import "@/styles/templates/consult.css";

interface WaitingCall {
    id: string;
    callerNumber: string;
    queueName: string;
    waitSeconds: number;
}
interface HistoryItem {
    id: string;
    date: string;
    summary: string;
    duration: string;
    type: string;
}

interface CustomerInfo {
    name: string;
    phone: string;
    email: string;
    company: string;
    memo: string;
    history: HistoryItem[];
}

// 예시 데이터
const MOCK_WAITING: WaitingCall[] = [
    { id: "1", callerNumber: "02-1234-5678", queueName: "일반상담", waitSeconds: 10 },
    { id: "2", callerNumber: "010-9876-5432", queueName: "기술지원", waitSeconds: 25 },
    { id: "3", callerNumber: "031-5555-6666", queueName: "영업문의", waitSeconds: 5 },
];

const MOCK_CUSTOMER: CustomerInfo = {
    name: "김XX",
    phone: "010-1234-5678",
    email: "test@example.com",
    company: "테스트 회사",
    memo: "VIP 고객",
    history: [
        { id: "1", date: "2026-02-20", summary: "제품 설치 문의", duration: "5분 23초", type: "인바운드"  },
        { id: "2", date: "2026-02-15", summary: "AS 신청",        duration: "3분 10초", type: "인바운드"  },
        { id: "3", date: "2026-02-01", summary: "요금 납부 확인",  duration: "2분 05초", type: "아웃바운드" },
    ],
}

const MOCK_SCRIPT = `안녕하세요, 고객님. 상담원 [이름]입니다.
어떻게 도와드릴까요?

---

【 공통 안내 멘트 】
• 본 통화는 서비스 품질 향상을 위해 녹음될 수 있습니다.
• 상담 완료 후 고객 만족도 조사가 진행될 수 있습니다.

【 자주 묻는 질문 】
1. 제품 설치 문의  →  기술지원팀 연결 (내선 2번)
2. 요금 및 결제    →  고객센터 연결 (내선 3번)
3. AS / 수리 접수  →  온라인 접수 안내 또는 직접 접수 처리`;


export default function ConsultTemplate() {
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'memo' | 'script'>('memo');
    const [memo, setMemo] = useState("");
    const [callTimer, setCallTimer] = useState(0);
    const [waitingCalls, setWaitingCalls] = useState<WaitingCall[]>(MOCK_WAITING);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const selectedCall = waitingCalls.find(c => c.id === selectedCallId);

    useEffect(() => {
        if (selectedCallId) {
            setCallTimer(0);
            timerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setCallTimer(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [selectedCallId]);

    const handleSelectCall = (id: string) => {
        setSelectedCallId(id);
        setMemo("");
        setActiveTab('memo');
    };

    const handleEndCall = () => {
        setWaitingCalls(prev => prev.filter(c => c.id !== selectedCallId));
        setSelectedCallId(null);
        setMemo("");
    };

    return (
        <div className="consult-container">
            {/* -- 좌측: 인입 목록 -- */}
            <section className="consult-col col-left-list">
                <div className="consult-col-header">
                    <h3 className="consult-section-title">인입목록</h3>
                    <span className="consult-badge">{waitingCalls.length}</span>
                </div>
                <div className="waiting-list">
                    {waitingCalls.length === 0 ? (
                        <div className="consult-empty-state">
                            <Phone size={32} strokeWidth={1.5} />
                            <p>대기 중인 통화가 없습니다.</p>
                        </div>
                    ) : (
                        waitingCalls.map(call => (
                            <div
                                key={call.id}
                                className={`waiting-item ${selectedCallId === call.id ? 'selected' : ''}`}
                                onClick={() => handleSelectCall(call.id)}
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

            {/* -- 중앙: 상담 진행 -- */}
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
                                <span className="call-status-dot blink" />
                                <div>
                                    <p className="call-number">{selectedCall.callerNumber}</p>
                                    <p className="call-queue-label">{selectedCall.queueName}</p>
                                </div>
                            </div>
                            <div className="call-timer">
                                <Clock size={14} />
                                {formatTimer(callTimer)}
                            </div>
                            <button className="btn-end-call" onClick={handleEndCall}>
                                <PhoneOff size={14} />
                                통화 종료
                            </button>
                        </div>

                        <div className="consult-tabs">
                            <button
                                className={`consult-tab ${activeTab === 'memo' ? 'active' : ''}`}
                                onClick={() => setActiveTab('memo')}
                            >
                                <FileText size={13}/>메모
                            </button>
                            <button
                                className={`consult-tab ${activeTab === 'script' ? 'active' : ''}`}
                                onClick={() => setActiveTab('script')}
                            >
                                <BookOpen size={13} /> 스크립트
                            </button>
                        </div>

                        <div className="consult-tab-content">
                            {activeTab === 'memo' ? (
                                <div className="memo-area">
                                    <textarea
                                        className="memo-textarea"
                                        placeholder="상담 내용을 입력하세요..."
                                        value={memo}
                                        onChange={e => setMemo(e.target.value)}
                                    />
                                    <div className="memo-footer">
                                        <span className="memo-char-count">{memo.length}자</span>
                                        <button className="btn-save-memo" disabled={!memo.trim()}>저장</button>
                                    </div>
                                </div>
                            ) : (
                                <pre className="script-viewer">{MOCK_SCRIPT}</pre>
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* -- 우측: 고객 프로필 -- */}
            <section className="consult-col col-right-info">
                {!selectedCall ? (
                    <div className="consult-empty-state">
                        <User size={40} strokeWidth={1.5} />
                        <p>통화를 선택하면<br />고객 정보가 표시됩니다</p>
                    </div>
                ) : (
                    <>
                        <h3 className="consult-section-title">고객 프로필</h3>
                        <div className="customer-card">
                            <div className="customer-avatar">{MOCK_CUSTOMER.name.charAt(0)}</div>
                            <div className="customer-card-info">
                                <p className="customer-name">{MOCK_CUSTOMER.name}</p>
                                <p className="customer-company">{MOCK_CUSTOMER.company}</p>
                            </div>
                        </div>
                        <div className="customer-details">
                            <div className="customer-detail-row">
                                <span className="detail-label">전화번호</span>
                                <span className="detail-value">{MOCK_CUSTOMER.phone}</span>
                            </div>
                            <div className="customer-detail-row">
                                <span className="detail-label">이메일</span>
                                <span className="detail-value">{MOCK_CUSTOMER.email}</span>
                            </div>
                            {MOCK_CUSTOMER.memo && (
                                <div className="customer-memo-box">{MOCK_CUSTOMER.memo}</div>
                            )}
                        </div>
                        <div className="history-section">
                            <h4 className="history-title">최근 상담 이력</h4>
                            <div className="history-list">
                                {MOCK_CUSTOMER.history.map(h => (
                                    <div key={h.id} className="history-item">
                                        <div className="history-item-left">
                                            <span className="history-type">{h.type}</span>
                                            <span className="history-summary">{h.summary}</span>
                                        </div>
                                        <div className="history-item-right">
                                            <span className="history-date">{h.date}</span>
                                            <span className="history-duration">{h.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}