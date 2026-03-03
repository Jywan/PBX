export interface PermissionAction {
    id: number | null;
    name: string;
    code: string;
    is_active: boolean;
}

export interface PermissionTemplate {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    children: PermissionAction[];
}

export interface PermissionTemplatePayload {
    menu_name: string;
    menu_code: string;
    actions: PermissionAction[];
}

export interface PermissionTemplateRequest {
    user_id: number;
    menu_id: number;
    permission_ids: number[];
}