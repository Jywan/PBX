import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";

export const usePermission = (code: string) => {
    const [hasAuth, setHasAuth] = useState(false);
    const permissions = useAuthStore((state) => state.permissions)

    useEffect(() => {
        setHasAuth(permissions.includes(code));
    }, [permissions, code]);

    return hasAuth;
};