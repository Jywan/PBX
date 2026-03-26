"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInfoFromToken } from "@/lib/auth";
import { createConsultation, fetchCategories } from "@/lib/api/consult";
import { createCustomer, fetchCustomerByPhone } from "@/lib/api/customers";
import type { ConsultCategory } from "@/types/consult";
import type { Customer } from "@/types/customer";
import type { CustomerCreate } from "@/lib/api/customers";

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

function flatCategories(list: ConsultCategory[]): ConsultCategory[] {
    const result: ConsultCategory[] = [];
    const walk = (items: ConsultCategory[]) => {
        for (const item of items) {
            result.push(item);
            if (item.children?.length) walk(item.children);
        }
    };
    walk(list);
    return result;
}

export function useConsultData() {
    const { token, companyId } = useAuth();
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"memo" | "script">("memo");
    const [memo, setMemo] = useState("");
    const [callTimer, setCallTimer] = useState(0);
    const [waitingCalls, setWaitingCalls] = useState<WaitingCall[]>([]);
    const [categories, setCategories] = useState<ConsultCategory[]>([]);
    const [consultCategoryId, setConsultCategoryId] = useState<number | null>(null);
    const [consultSaving, setConsultSaving] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAtRef = useRef<string | null>(null);

    const selectedCall = waitingCalls.find(c => c.id === selectedCallId) ?? null;

    useEffect(() => {
        if (!token || !companyId) return;
        fetchCategories(token, companyId)
            .then(data => setCategories(flatCategories(data)))
            .catch(() => {});
    }, [token, companyId]);

    useEffect(() => {
        if (selectedCallId) {
            setCallTimer(0);
            startedAtRef.current = new Date().toISOString();
            timerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setCallTimer(0);
            startedAtRef.current = null;
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [selectedCallId]);

    const handleSelectCall = (id: string) => {
        setSelectedCallId(id);
        setMemo("");
        setConsultCategoryId(null);
        setCustomer(null);
        setActiveTab("memo");

        if (token) {
            const call = waitingCalls.find(c => c.id === id);
            if (call?.callerNumber) {
                fetchCustomerByPhone(token, call.callerNumber)
                    .then(found => { if (found) setCustomer(found); })
                    .catch(() => {});
            }
        }
    };

    const handleEndCall = () => {
        setWaitingCalls(prev => prev.filter(c => c.id !== selectedCallId));
        setSelectedCallId(null);
        setMemo("");
        setConsultCategoryId(null);
        setCustomer(null);
    };

    const handleCreateCustomer = async (data: CustomerCreate) => {
        if (!token) return;
        const created = await createCustomer(token, data);
        setCustomer(created);
    };

    const handleSaveConsult = async () => {
        if (!token) return;
        const userInfo = getUserInfoFromToken();
        if (!userInfo) return;
        setConsultSaving(true);
        try {
            await createConsultation(token, {
                agent_id: userInfo.id,
                company_id: userInfo.company_id,
                call_id: selectedCall?.id ?? undefined,
                category_id: consultCategoryId ?? undefined,
                memo: memo.trim() || undefined,
                started_at: startedAtRef.current ?? undefined,
                ended_at: new Date().toISOString(),
            });
            setMemo("");
            setConsultCategoryId(null);
        } finally {
            setConsultSaving(false);
        }
    };

    return {
        waitingCalls, selectedCall, selectedCallId,
        activeTab, setActiveTab,
        memo, setMemo,
        callTimer,
        customer,
        categories,
        consultCategoryId, setConsultCategoryId,
        consultSaving,
        handleSelectCall, handleEndCall, handleSaveConsult, handleCreateCustomer,
    };
}
