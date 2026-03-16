import apiClient from "./client";
import { API_URL } from "@/lib/config";
import type { IvrFlow, IvrFlowCreate, IvrFlowUpdate, IvrNode, IvrNodeCreate, IvrNodeUpdate, IvrSound } from "@/types/ivr";

const BASE = `${API_URL}/api/v1/ivr`;

export const fetchFlows = async (
    token: string,
    params?: { company_id?: number; include_presets?: boolean }
): Promise<IvrFlow[]> => {
    const res = await apiClient.get<IvrFlow[]>(`${BASE}/flows`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
    });
    return res.data;
};

export const fetchFlow = async (token: string, flowId: number): Promise<IvrFlow> => {
    const res = await apiClient.get<IvrFlow>(`${BASE}/flows/${flowId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createFlow = async (token: string, data: IvrFlowCreate): Promise<IvrFlow> => {
    const res = await apiClient.post<IvrFlow>(`${BASE}/flows`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const updateFlow = async (token: string, flowId: number, data: IvrFlowUpdate): Promise<IvrFlow> => {
    const res = await apiClient.patch<IvrFlow>(`${BASE}/flows/${flowId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteFlow = async (token: string, flowId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/flows/${flowId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const cloneFlow = async (
    token: string,
    flowId: number,
    data: { name: string, company_id?: number | null }
): Promise<IvrFlow> => {
    const res = await apiClient.post<IvrFlow>(`${BASE}/flows/${flowId}/clone`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createNode = async (token: string, flowId: number, data: IvrNodeCreate): Promise<IvrNode> => {
    const res = await apiClient.post<IvrNode>(`${BASE}/flows/${flowId}/nodes`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const updateNode = async (token: string, nodeId: number, data: IvrNodeUpdate): Promise<IvrNode> => {
    const res = await apiClient.patch<IvrNode>(`${BASE}/nodes/${nodeId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const deleteNode = async (token: string, nodeId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/nodes/${nodeId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const uploadNodeSound = async (
    token: string,
    nodeId: number,
    formData: FormData
): Promise<IvrSound> => {
    const res = await apiClient.post<IvrSound>(`${BASE}/nodes/${nodeId}/sound`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
};

export const deleteNodeSound = async (token: string, nodeId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/nodes/${nodeId}/sound`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
