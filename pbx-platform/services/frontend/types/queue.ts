export type QueueStrategy = 
    | "ringall" | "rrmemory" | "leastrecent" | "fewestcalls" | "wrandom" | "linear";

export interface UserSummary {
    id: number;
    name: string;
    exten: string | null;
}

export interface QueueMember {
    id: number;
    queue_id: number;
    user_id: number | null;
    interface: string;
    membername: string | null;
    penalty: number;
    paused: boolean;
    created_at: string;
    user: UserSummary | null;
}

export interface Queue {
    id: number;
    name: string;
    company_id: number | null;
    strategy: QueueStrategy;
    timeout: number;
    wrapuptime: number;
    maxlen: number;
    music_on_hold: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    members: QueueMember[];
}

export interface QueueCreate {
    name: string;
    company_id?: number | null;
    strategy?: QueueStrategy;
    timeout?: number;
    wrapuptime?: number;
    maxlen?: number;
    music_on_hold?: string | null;
}

export interface QueueUpdate {
    name?: string;
    strategy?: QueueStrategy;
    timeout?: number;
    wrapuptime?: number;
    maxlen?: number;
    music_on_hold?: string | null;
    is_active?: boolean;
}

export interface QueueMemberCreate {
    user_id?: number | null;
    interface: string;
    membername?: string | null;
    penalty?: number;
}
