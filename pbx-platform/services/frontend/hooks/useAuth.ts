"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { isSystemAdmin as checkSystemAdmin, getUserInfoFromToken } from "@/lib/auth";

export const useAuth = () => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);
    const [companyId, setCompanyId] = useState<number | null>(null);
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

        // 토큰에서 company_id 추출
        const userInfo = getUserInfoFromToken();
        if (userInfo && userInfo.company_id) {
            setCompanyId(userInfo.company_id);
        }

        setIsLoading(false);
    }, [router]);

    return { token, isSystemAdmin, companyId, isLoading };
};