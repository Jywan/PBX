export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    group: string;
    memo: string;
    createdAt: string;
    lastCallAt: string | null;
}

export interface CustomerGroup {
    id: string;
    label: string;
    color: string;
}

export interface CallHistory {
    id: string;
    date: string;
    direction: string;
    duration: string;
}
