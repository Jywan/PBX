"use client";

import { useState, useEffect } from "react";
import { hasPermission, isSystemAdmin } from "@/lib/auth";

interface UseAccessDeniedOptions {
    requiredPermission?: string;
    requiredSystemAdmin?: boolean;
    customCheck?: () => boolean;
}

/**
 * 페이지 권한 체크 및 접근 거부 모달 관리 훅
 *
 * @example
 * // 특정 권한 필요
 * const { isDenied } = useAccessDenied({ requiredPermission: "agent-detail" });
 *
 * @example
 * // 시스템 관리자만 접근
 * const { isDenied } = useAccessDenied({ requiredSystemAdmin: true });
 *
 * @example
 * // 커스텀 권한 체크
 * const { isDenied } = useAccessDenied({
 *      customCheck: () => {
 *          const userInfo = getUserInfoFromToken();
 *          return userInfo?.role === "MANAGER" || userInfo?.role === "SYSTEM_ADMIN";
 *      }
 * });
 */
export const useAccessDenied = (options: UseAccessDeniedOptions = {}) => {
    const [isDenied, setIsDenied] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = () => {
            setIsChecking(true);

            try {
                // 시스템 관리자는 모든 권한 체크를 바이패스
                if (isSystemAdmin()) {
                    setIsDenied(false);
                    return;
                }

                // 1. 커스텀 체크 함수가 있으면 우선 사용
                if (options.customCheck) {
                    const hasAccess = options.customCheck();
                    setIsDenied(!hasAccess);
                    return;
                }

                // 2. 특정 권한 체크
                if (options.requiredPermission) {
                    const hasPerm = hasPermission(options.requiredPermission);
                    setIsDenied(!hasPerm);
                    return;
                }

                // 4. 옵션이 없으면 접근 허용
                setIsDenied(false);
            } catch (error) {
                console.error("권한 체크중 오류:", error);
                setIsDenied(true);
            } finally {
                setIsChecking(false);
            }
        };

        checkAccess();
    }, [options.requiredPermission, options.requiredSystemAdmin]);

    return { isDenied, isChecking };
};