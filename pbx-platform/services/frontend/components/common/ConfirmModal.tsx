// components/common/ConfirmModal.tsx

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "@/styles/common/modal.css"; // CSS 파일 경로는 실제 위치에 맞게!

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmModal({ 
    isOpen, 
    title = "확인", 
    message, 
    onConfirm, 
    onClose 
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-ghost" onClick={onClose}>취소</button>
                    <button className="btn-primary" onClick={() => {
                        onConfirm();
                        onClose();
                    }}>확인</button>
                </div>
            </div>
        </>,
        document.body
    );
}