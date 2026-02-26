// components/common/Toast.tsx

import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";

interface ToastState {
    message: string;
    type: 'success' | 'error' | null;
    isExiting: boolean;
}

interface ToastProps {
    toast: ToastState;
}

export default function Toast({ toast }: ToastProps) {
    if (!toast.type) return null;

    return (
        <div className="toast-container">
            <div className={`toast ${toast.type} ${toast.isExiting ? 'exit' : ''}`}>
                <div className="toast-icon-wrapper">
                    {toast.type === 'success'
                        ? <SuccessIcon className="toast-icon success" />
                        : <ErrorIcon className="toast-icon error" />
                    }
                </div>
                {toast.message}
            </div>
        </div>
    );
}
