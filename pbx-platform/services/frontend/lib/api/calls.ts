import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export interface CallRecord {
    id: string;
    created_at: string;
    started_at: string | null;
    answered_at: string | null;
    ended_at: string | null;
    caller_exten: string | null;
    callee_exten: string | null;
    direction: string;
    status: string;
    hangup_reason: string | null;
    hangup_cause: number | null;
}

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
}