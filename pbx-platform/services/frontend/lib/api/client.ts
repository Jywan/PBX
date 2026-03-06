import axios from "axios";
import { API_URL } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";
import Cookies from "js-cookie";

const apiClient = axios.create();

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            const token = Cookies.get("access_token");
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/api/v1/auth/me/permissions`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    useAuthStore.getState().setPermissions(res.data.permissions);
                    // 권한 갱신 후 원래 요청 재시도
                    return apiClient(originalRequest);
                } catch {
                    // 권한 갱신 실패 시 원래 에러 전파
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
