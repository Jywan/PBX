export type QueueStrategy = 
    | "ringall" | "rrmemory" | "leastrecent" | "fewestcalls" | "wrandom" | "linear";

export interface QueueMember {
    id: number;
    queue_id: number;
    interface: string;      // e.g. "SIP/1001"
    membername: string;
    penalty: number;
    paused: boolean;
    created_at: string;
}

export interface Queue {
    id: number;
    name: string;
    company_id: number | null;
    strategy: QueueStrategy;
    timeout: number;
    wrapuptime: number;
    maxlen: number;
    music_on_hole: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    members: QueueMember[];
}

export interface QueueCreate {
    name: string;
    company_id?: number | null;
    strategy?: QueueStrategy;
    timeout?: number,
    wrapuptime?: number;
    maxlen?: number;
    music_on_hold?: string;
}

export interface QueueUpdate {
    name?: string;
    strategy?: QueueStrategy;
    timeout?: number;
    wrapuptime?: number;
    maxlen?: number;
    music_on_hold?: string;
    is_active?: boolean;
}

export interface QueueMemberCreate {
    interface: string;
    membername?: string;
    penalty?: number;
}