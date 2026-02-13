import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 권한 템플릿 목록 조회 (메뉴 + 하위 액션)
 */
export const fetchPermissionTemplates = async (token: string) => {
    const response = await axios.get(`${API_URL}/api/v1/permissions/templates`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * 사용자별 보유 권한 ID 목록 조회
 */
export const fetchUserPermissions = async (
    token: string,
    userId: number
): Promise<number[]> => {
    const response = await axios.get(`${API_URL}/api/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.permission_ids;
};

/**
 * 사용자에게 메뉴별 권한 할당
 */
export const assignUserPermissions = async (
    token: string,
    data: { user_id: number; menu_id: number; permission_ids: number[] }
): Promise<void> => {
    await axios.post(`${API_URL}/api/v1/permissions/assign`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
