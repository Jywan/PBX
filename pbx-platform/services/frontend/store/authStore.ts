import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
    permissions: string[];
    expiresAt: number | null;
    setPermissions: (perms: string[]) => void;
    resetAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            permissions: [],
            expiresAt: null,
            setPermissions: (perms) => {
                // 10시간 뒤의 타임스탬프 계산 (10시간 * 60분 * 60초 * 1000ms)
                const tenHoursInMs = 10 * 60 * 60 * 1000;
                const expiry = Date.now() + tenHoursInMs;
                
                set({ permissions: perms, expiresAt: expiry });
            },
            resetAuth: () => set({ permissions: [] }),
        }),
        {
            name: 'user-permission-storage', // localStorage 키 이름
        }
    )
);