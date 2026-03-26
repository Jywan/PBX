import apiClient from "./client";
import { API_URL } from "@/lib/config";
import type { Consultation, ConsultCategory } from "@/types/consult";

export interface ConsultFilter {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    agent_id?: number;
    company_id?: number;
    status?: string;
}

export interface ConsultCreate {
    agent_id: number;
    company_id: number;
    call_id?: string;
    category_id?: number;
    category?: string;
    memo?: string;
    started_at?: string;
    ended_at?: string;
}

export interface ConsultUpdate {
    category_id?: number | null;
    category?: string;
    memo?: string;
    ended_at?: string | null;
}

export const fetchConsultations = async(token: string, f: ConsultFilter = {}): Promise<Consultation[]> => {
    const params = new URLSearchParams();
    if (f.skip !== undefined) params.set("skip", String(f.skip));
    if (f.limit !== undefined) params.set("limit", String(f.limit));
    if (f.date_from) params.set("date_from", f.date_from);
    if (f.date_to) params.set("date_to", f.date_to);
    if (f.agent_id) params.set("agent_id", String(f.agent_id));
    if (f.company_id) params.set("company_id", String(f.company_id));
    if (f.status) params.set("status", f.status);
    const res = await apiClient.get<Consultation[]>(`${API_URL}/api/v1/consults?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const createConsultation = async (token: string, data: ConsultCreate): Promise<Consultation> => {
    const res = await apiClient.post<Consultation>(`${API_URL}/api/v1/consults`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const updateConsultation = async (token: string, id: number, data: ConsultUpdate): Promise<Consultation> => {
    const res = await apiClient.patch<Consultation>(`${API_URL}/api/v1/consults/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const deleteConsultation = async (token: string, id: number): Promise<void> => {
    const res = await apiClient.delete(`${API_URL}/api/v1/consults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const fetchCategories = async (token: string, company_id: number): Promise<ConsultCategory[]> => {
    const res = await apiClient.get<ConsultCategory[]>(
        `${API_URL}/api/v1/consults/categories?company_id=${company_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};