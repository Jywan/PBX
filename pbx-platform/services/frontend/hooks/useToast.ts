"use client";

import { useState, useCallback } from "react";

type ToastType = 'success' | 'error' | null;

interface ToastState {
    message: string;
    type: ToastType;
    isExiting: boolean;
}

export const useToast = () => {
    const [toast, setToast] = useState<ToastState>({
        message: "",
        type: null,
        isExiting: false
    });

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type, isExiting: false });
        setTimeout(() => setToast(prev => ({ ...prev, isExiting: true })), 2600);
        setTimeout(() => setToast({ message: "", type: null, isExiting: false }), 3000);
    }, []);

    return { toast, showToast };
}