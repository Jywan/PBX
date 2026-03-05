"use client";

import { useEffect, useState, useRef } from "react";

export interface WaitingCall {
    id: string;
    callerNumber: string;
    queueName: string;
    waitSeconds: number;
}

export interface HistoryItem {
    id: string;
    date: string;
    summary: string;
    duration: string;
    type: string;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    email: string;
    company: string;
    memo: string;
    history: HistoryItem[];
}

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
        { id: "1", date: "2026-02-20", summary: "제품 설치 문의", duration: "5분 23초", type: "인바운드" },
        { id: "2", date: "2026-02-25", summary: "AS 신청", duration: "3분 10초", type: "아웃바운드" },
        { id: "3", date: "2026-02-01", summary: "요금 납부 확인", duration: "2분 05초", type: "아웃바운드" },
    ],
};

export const MOCK_SCRIPT = `안녕하세요, 고객님. 상담원 [이름]입니다.
어떻게 도와드릴까요?

---

【 공통 안내 멘트 】
• 본 통화는 서비스 품질 향상을 위해 녹음될 수 있습니다.
• 상담 완료 후 고객 만족도 조사가 진행될 수 있습니다.

【 자주 묻는 질문 】
1. 제품 설치 문의  →  기술지원팀 연결 (내선 2번)
2. 요금 및 결제    →  고객센터 연결 (내선 3번)
3. AS / 수리 접수  →  온라인 접수 안내 또는 직접 접수 처리`;

export function useConsultData() {
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"memo" | "script">("memo");
    const [memo, setMemo] = useState("");
    const [callTimer, setCallTimer] = useState(0);
    const [waitingCalls, setWaitingCalls] = useState<WaitingCall[]>(MOCK_WAITING); // 테이블 생성 이전까지는 더미데이터 출력
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const selectedCall = waitingCalls.find(c => c.id === selectedCallId) ?? null;

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
        setActiveTab("memo");
    };

    const handleEndCall = () => {
        setWaitingCalls(prev => prev.filter(c => c.id !== selectedCallId));
        setSelectedCallId(null);
        setMemo("");
    };

    return {
        waitingCalls, selectedCall, selectedCallId,
        activeTab, setActiveTab,
        memo, setMemo,
        callTimer,
        customer: MOCK_CUSTOMER,
        handleSelectCall, handleEndCall,
    };
}
