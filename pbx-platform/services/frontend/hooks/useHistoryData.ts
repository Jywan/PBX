"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCalls, CallRecord } from "@/lib/api/calls";

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
    const [applied, setAppled] = useState<FilterState>(defaultFilter);
    const [selectedId, setSelectedId] = useState<string | null> (null);

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

    const handleApply = () => { setAppled(filter); setSelectedId(null) };
    const handleReset = () => { setFilter(defaultFilter); setAppled(defaultFilter); setSelectedId(null); };

    function directionLabel(d: string) { return DIRECTION_MAP[d] ?? d; }
    function statusLabel(s: string) { return STATUS_MAP[s] ?? s; }
    function statusClass(s: string) {
        if (s === "ended") return "status-ended";
        if (s === "up" ) return "status-up";
        return "status-new";
    }
    function directionClass(d: string) {
        if (d === "inbound") return "dir-inbound";
        if (d === "outbound") return "dir-outbound";
        return "dir-internal";
    }

    return {
        filtered, selectedCall, loading, error,
        filter, setFilter,
        selectedId, setSelectedId,
        handleApply, handleReset,
        directionLabel, statusLabel, statusClass, directionClass,
    };
}

