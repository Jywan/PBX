import { useState, useCallback } from "react";

export const useConfirmModal = () => {
    const [state, setState] = useState({
        isOpen: false,
        message: "",
        onConfirm: () => {},
    });

    const openConfirm = useCallback((message: string, onConfirm: () => void) => {
        setState({
            isOpen: true,
            message,
            onConfirm,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false}));
    }, []);

    return {
        isOpen: state.isOpen,
        message: state.message,
        onConfirm: state.onConfirm,
        openConfirm,
        closeConfirm,
    };
};