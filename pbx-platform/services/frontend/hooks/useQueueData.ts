"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
    fetchQueues, fetchQueue, createQueue, updateQueue,
    deleteQueue, addQueueMember, removeQueueMember, updateQueueMember,
} from "@/lib/api/queue";
import type { Queue, QueueCreate, QueueUpdate, QueueMemberCreate } from "@/types/queue";

export function useQueueData(showToast: (msg: string, type: "success" | "error") => void) {
    const { token, companyId, isSystemAdmin } = useAuth();

    const [queues, setQueues] = useState<Queue[]>([]);
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [loading, setLoading] = useState(false);
    const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);

    const loadQueues = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchQueues(token, {
                company_id: isSystemAdmin ? (filterCompanyId ?? undefined) : companyId ?? undefined,
            });
            setQueues(data);
        } catch {
            showToast("큐 목록 로드 실패", "error");
        } finally {
            setLoading(false);
        }
    }, [token, companyId, isSystemAdmin, filterCompanyId, showToast]);

    useEffect(() => {
        loadQueues();
    }, [loadQueues]);

    const handleSelectQueue = useCallback(async (queue: Queue) => {
        if (!token) return;
        try {
            const detail = await fetchQueue(token, queue.id);
            setSelectedQueue(detail);
        } catch {
            showToast("큐 로드 실패", "error");
        }
    }, [token, showToast]);

    const handleCreateQueue = useCallback(async (data: QueueCreate) => {
        if (!token) return;
        try {
            const created = await createQueue(token, {
                ...data,
                company_id: isSystemAdmin ? (data.company_id ?? null) : companyId,
            });
            await loadQueues();
            await handleSelectQueue(created);
            showToast("큐가 생성되었습니다", "success");
        } catch {
            showToast("큐 생성 실패", "error");
        }
    }, [token, companyId, isSystemAdmin, loadQueues, handleSelectQueue, showToast]);

    const handleUpdateQueue = useCallback(async (queueId: number, data: QueueUpdate) => {
        if (!token) return;
        try {
            await updateQueue(token, queueId, data);
            await loadQueues();
            if (selectedQueue?.id === queueId) {
                const updated = await fetchQueue(token, queueId);
                setSelectedQueue(updated);
            }
            showToast("수정되었습니다.", "success");
        } catch {
            showToast("수정 실패", "error");
        }
    }, [token, selectedQueue, loadQueues, showToast]);

    const handleDeleteQueue = useCallback(async (queueId: number) => {
        if (!token) return;
        try {
            await deleteQueue(token, queueId);
            if (selectedQueue?.id === queueId) setSelectedQueue(null);
            await loadQueues();
            showToast("삭제되었습니다.", "success");
        } catch {
            showToast("삭제 실패", "error");
        }
    }, [token, selectedQueue, loadQueues, showToast]);

    const handleAddMember = useCallback(async (queueId: number, data: QueueMemberCreate) => {
        if (!token) return;
        try {
            await addQueueMember(token, queueId, data);
            if (selectedQueue?.id === queueId) {
                const updated = await fetchQueue(token, queueId);
                setSelectedQueue(updated);
            }
            showToast("멤버가 추가되었습니다.", "success");
        } catch {
            showToast("멤버 추가 실패", "error")
        }
    }, [token, selectedQueue, showToast]);

    const handleRemoveMember = useCallback(async (memberId: number) => {
        if (!token || !selectedQueue) return;
        try {
            await removeQueueMember(token, memberId);
            const updated = await fetchQueue(token, selectedQueue.id);
            setSelectedQueue(updated);
            showToast("멤버가 제거되었습니다.", "success");
        } catch {
            showToast("멤버 제거 실패", "error");
        }
    }, [token, selectedQueue, showToast]);

    const handleTogglePause = useCallback(async (memberId: number, paused: boolean) => {
        if (!token || !selectedQueue) return;
        try {
            await updateQueueMember(token, memberId, { paused });
            const updated = await fetchQueue(token, selectedQueue.id);
            setSelectedQueue(updated);
        } catch {
            showToast("상태 변경 실패", "error");
        }
    }, [token, selectedQueue, showToast])

    return {
        queues, selectedQueue, loading, filterCompanyId, setFilterCompanyId,
        handleSelectQueue, handleCreateQueue, handleUpdateQueue, handleDeleteQueue,
        handleAddMember, handleRemoveMember, handleTogglePause,
    };
}