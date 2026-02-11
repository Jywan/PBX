"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { isSystemAdmin as checkSystemAdmin } from "@/lib/auth";

export const useAuth = () => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cookieToken = Cookies.get("access_token");

        // 토큰이 없으면 로그인 페이지로 이동
        if (!cookieToken) {
            router.push("/login");
            return;
        }

        setToken(cookieToken);

        // lib/auth.ts의 권한 체크 함수 사용
        const isAdmin = checkSystemAdmin();
        setIsSystemAdmin(isAdmin);
        setIsLoading(false);
    }, [router]);

    return { token, isSystemAdmin, isLoading };
};