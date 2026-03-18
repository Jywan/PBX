import apiClient from "./client";
import { API_URL } from "@/lib/config";
import type { Queue, QueueCreate, QueueUpdate, QueueMember, QueueMemberCreate } from "@/types/queue";

const BASE = `${API_URL}/api/v1/queues`;

export const fetchQueues = async (
    token: string,
    params?: { company_id?: number }
): Promise<Queue[]> => {
    const res = await apiClient.get<Queue[]>(BASE, {
        headers: { Authorization: `Bearer ${token}` },
        params,
    });
    return res.data;
};

export const fetchQueue = async (token: string, queueId: number): Promise<Queue> => {
    const res = await apiClient.get<Queue>(`${BASE}/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createQueue = async (token: string, data: QueueCreate): Promise<Queue> => {
    const res = await apiClient.post<Queue>(BASE, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const updateQueue = async (
    token: string,
    queueId: number,
    data: QueueUpdate
): Promise<Queue> => {
    const res = await apiClient.patch<Queue>(`${BASE}/${queueId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const deleteQueue = async (token: string, queueId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const addQueueMember = async (
    token: string,
    queueId: number,
    data: QueueMemberCreate
): Promise<QueueMember> => {
    const res = await apiClient.post<QueueMember>(`${BASE}/${queueId}/members`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const removeQueueMember = async (
    token: string,
    memberId: number
): Promise<void> => {
    await apiClient.delete(`${BASE}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateQueueMember = async (
    token: string,
    memberId: number,
    data: { penalty?: number; paused?: boolean }
): Promise<QueueMember> => {
    const res = await apiClient.patch<QueueMember>(`${BASE}/members/${memberId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};