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


export function useConsultData() {
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"memo" | "script">("memo");
    const [memo, setMemo] = useState("");
    const [callTimer, setCallTimer] = useState(0);
    const [waitingCalls, setWaitingCalls] = useState<WaitingCall[]>([]);
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
        customer: null,
        handleSelectCall, handleEndCall,
    };
}
