import axios from "axios";
import type { User, UserCreateRequest, UserUpdateRequest } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 사용자 목록 조회
 * @param token - JWT 토큰
 * @param companyId - 업체 ID (선택적, 시스템 관리자만 사용)
 */
export const fetchUsers = async (
    token: string,
    companyId?: number
): Promise<User[]> => {
    const params: any = {};
    if (companyId !== undefined) {
        params.company_id = companyId;
    }

    const response = await axios.get<User[]>(`${API_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

/**
 * 사용자 생성
 */
export const createUser = async (
    token: string,
    data: UserCreateRequest
): Promise<User> => {
    const response = await axios.post<User>(`${API_URL}/api/v1/users`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * 사용자 수정
 */
export const updateUser = async (
    token: string,
    id: number,
    data: UserUpdateRequest
): Promise<User> => {
    const response = await axios.patch<User>(`${API_URL}/api/v1/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * 사용자 삭제 (비활성화)
 */
export const deleteUser = async (
    token: string,
    id: number
): Promise<void> => {
    await axios.delete(`${API_URL}/api/v1/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

/**
 * 사용자 재활성화
 */
export const restoreUser = async (
    token: string,
    id: number
): Promise<User> => {
    const response = await axios.patch<User>(`${API_URL}/api/v1/users/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};