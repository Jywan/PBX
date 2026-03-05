import apiClient from "./client";
import { API_URL } from "../config";

/**
 * 로그아웃 (서버 측 토큰 무효화)
 */
export const logout = async (token: string): Promise<void> => {
    await apiClient.post(`${API_URL}/api/v1/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
