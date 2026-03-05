export interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    company_id: number | null;
    company_name: string | null;
    group: string;
    memo: string | null;
    created_at: string;
    last_call_at: string | null;
    deactivated_at: string | null;
}

export interface CustomerGroup {
    id: string;
    label: string;
    color: string;
}

export interface CallHistory {
    id: string;
    date: string;
    direction: "inbound" | "outbound" | "internal";
    duration: string;
}