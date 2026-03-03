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