import apiClient from "./client";
import { API_URL } from "@/lib/config";
import { CallRecord } from "@/types/call";

export type { CallRecord };

export interface CallFilter {
    dateFrom?: string;
    dateTo?: string;
    direction?: string;
    status?: string;
    search?: string;
}

export const fetchCalls = async (
    token: string,
    filter: CallFilter = {},
    skip: number = 0,
    limit: number = 100
): Promise<CallRecord[]> => {
    const params: Record<string, string | number> = { skip, limit };

    if (filter.dateFrom) params.date_from = filter.dateFrom;
    if (filter.dateTo) params.date_to = filter.dateTo;
    if (filter.direction) params.direction = filter.direction;
    if (filter.status) params.status = filter.status;
    if (filter.search) params.search = filter.search;

    const response = await apiClient.get<CallRecord[]>(`${API_URL}/api/v1/calls/`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
    });
    return response.data;
};