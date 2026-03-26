export interface ConsultAgent {
    id: number;
    name: string;
}

export interface ConsultCompany {
    id: number;
    company_name: string;
}

export interface ConsultCategoryBrief {
    id: number;
    name: string;
    depth: number;
}

export interface ConsultCategory {
    id: number;
    company_id: number;
    parent_id: number | null;
    name: string;
    depth: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    children: ConsultCategory[];
}

export interface Consultation {
    id: number;
    call_id: string | null;
    agent_id: number;
    company_id: number;
    original_id: number | null;
    category_id: number | null;
    memo: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUPERSEDED";
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    updated_at: string;
    agent: ConsultAgent | null;
    company: ConsultCompany | null;
    category_obj: ConsultCategoryBrief | null;
}