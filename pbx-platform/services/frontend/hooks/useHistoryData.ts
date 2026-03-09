"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCalls, CallFilter, CallRecord } from "@/lib/api/calls";

const DIRECTION_MAP: Record<string, string> = {
    internal: "내선",
    inbound: "인바운드",
    outbound: "아웃바운드",
};

const STATUS_MAP: Record<string, string> = {
    ended: "종료",
    up: "통화중",
    new: "대기",
};

export interface FilterState {
    dateFrom: string;
    dateTo: string;
    direction: string;
    status: string;
    search: string;
};

const defaultFilter: FilterState = {
    dateFrom: "",
    dateTo: "",
    direction: "",
    status: "",
    search: "",
};

export function useHistoryData() {
    const { token, isLoading: authLoading } = useAuth();
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterState>(defaultFilter);
    const [selectedId, setSelectedId] = useState<string | null> (null);

    const loadCalls = useCallback(async (f: FilterState) => {
        if (!token) return;
        setLoading(true);
        setError(null);
        const callFilter: CallFilter = {
            dateFrom: f.dateFrom || undefined,
            dateTo: f.dateTo || undefined,
            direction: f.direction || undefined,
            status: f.status || undefined,
            search: f.search || undefined,
        };
        try {
            const data = await fetchCalls(token, callFilter);
            setCalls(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "unknown";
            setError("데이터 로드 실패: " + msg);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading || !token) return;
        loadCalls(defaultFilter);
    }, [token, authLoading, loadCalls]);

    const selectedCall = calls.find(c => c.id ===selectedId) ?? null;

    const handleApply = () => {
        setSelectedId(null);
        loadCalls(filter);
    };

    const handleReset = () => {
        setFilter(defaultFilter);
        setSelectedId(null);
        loadCalls(defaultFilter);
    };

    function directionLabel(d: string) { return DIRECTION_MAP[d] ?? d; }
    function statusLabel(s: string) { return STATUS_MAP[s] ?? s; }
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

    return {
        filtered: calls,
        selectedCall,
        loading,
        error,
        filter,
        setFilter,
        selectedId,
        setSelectedId,
        handleApply,
        handleReset,
        directionLabel,
        statusLabel,
        statusClass,
        directionClass,
    };
}

