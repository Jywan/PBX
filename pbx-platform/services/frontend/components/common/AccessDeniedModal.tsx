"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import "@/styles/common/modal.css";

interface AccessDeniedModalProps {
    isOpen: boolean;
    message?: string;
    redirectPath?: string;
    autoCloseDelay?: number;
    onRedirect?: () => void;
}

export default function AccessDeniedModal({
    isOpen,
    message = "접근 권한이 없습니다.",
    redirectPath = "/",
    autoCloseDelay = 3000,
    onRedirect
}: AccessDeniedModalProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [countdown, setCountdown] = useState(Math.floor(autoCloseDelay / 1000));

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // 카운드다운 및 자동 리다이렉트
    useEffect(() => {
        if (!isOpen) return;

        setCountdown(Math.floor(autoCloseDelay / 1000));

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const redirectTimer = setTimeout(() => {
            // onRedirect 콜백이 있으면 사용, 없으면 기존 router.push
            if (onRedirect) {
                onRedirect();
            } else {
                router.push(redirectPath);
            }
        }, autoCloseDelay);

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(redirectTimer);
        };
    }, [isOpen, autoCloseDelay, redirectPath, router, onRedirect]);

    // 즉시 이동 핸들러
    const handleImmediateRedirect = () => {
        // onRedirect 우선 사용
        if (onRedirect) {
            onRedirect();
        } else {
            router.push(redirectPath);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <>
            <div className="modal-overlay"/>
            <div className="modal-content access-denied-modal">
                <div className="modal-header">
                    <div className="access-denied-icon">⛔</div>
                    <h3>접근 권한 없음</h3>
                </div>
                <div className="modal-body">
                    <p className="access-denied-message">{message}</p>
                    <p className="access-denied-redirect-info">
                        {countdown}초 후 메인 페이지로 이동합니다.
                    </p>
                </div>
                <div className="modal-footer">
                    <button
                        className="btn-primary"
                        onClick={handleImmediateRedirect}
                    >
                        지금 이동하기
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}