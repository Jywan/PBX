export type IvrNodeType = "greeting" | "menu" | "transfer" | "hangup" | "voicemail";

export interface IvrNodeConfig {
    message?: string;
    prompt?: string;
    timeout?: number;
    target_exten?: string;
    mailbox?: string;
}

export interface IvrSound {
    id: number;
    node_id: number;
    name: string;
    filename: string;
    original_filename: string;
    created_at: string;
}

export interface IvrNode {
    id: number;
    flow_id: number;
    parent_id: number | null;
    dtmf_key: string | null;
    node_type: IvrNodeType;
    name: string;
    config: IvrNodeConfig;
    sort_order: number;
    sound?: IvrSound | null;
    children?: IvrNode[];
}

export interface IvrFlow {
    id: number;
    name: string;
    company_id: number | null;
    is_preset: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    nodes: IvrNode[];
}

export interface IvrFlowCreate {
    name: string;
    company_id?: number | null;
    is_preset?: boolean;
}

export interface IvrFlowUpdate {
    name?: string;
    is_active?: boolean;
}

export interface IvrNodeCreate {
    flow_id: number;
    parent_id?: number | null;
    dtmf_key?: string | null;
    node_type: IvrNodeType;
    name: string;
    config?: IvrNodeConfig;
    sort_order?: number;
}

export interface IvrNodeUpdate {
    parent_id?: number | null;
    dtmf_key?: string | null;
    node_type?: IvrNodeType;
    name?: string;
    config?: IvrNodeConfig;
    sort_order?: number;
}
