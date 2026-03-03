import axios from "axios";
import { API_URL } from "@/lib/config";
import { CallRecord } from "@/types/call";

export type { CallRecord };

export const fetchCalls = async (
    token: string,
    skip: number = 0,
    limit: number = 500
): Promise<CallRecord[]> => {
    const response = await axios.get<CallRecord[]>(`${API_URL}/api/v1/calls/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { skip, limit }
    });
    return response.data;
};