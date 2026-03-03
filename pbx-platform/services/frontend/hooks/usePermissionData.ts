"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    fetchPermissionTemplates,
    savePermissionTemplate,
    updatePermissionTemplateStatus,
    deletePermissionTemplate,
} from "@/lib/api/permissions";
import { useConfirmModal } from "@/hooks/useConfirmModal";

export type ActionItem = {
    id: number | null;
    name: string;
    code: string;
    is_active: boolean;
};

type Params = {
    token: string | null;
    authLoading: boolean;
    showToast: (message: string, type: "success" | "error") => void;
};

export function usePermissionData({ token, authLoading, showToast }: Params) {
    const router = useRouter();
    const { isOpen: confirmOpen, message: confirmMessage, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [menuName, setMenuName] = useState("");
    const [menuCode, setMenuCode] = useState("");
    const [actions, setActions] = useState<ActionItem[]>([{ id: null, name: "", code: "", is_active: true }]);

    const fetchTemplates = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchPermissionTemplates(token);
            setTemplates(data);
        } catch (error: any) {
            console.error("Fetch Error:", error);
            if (error.response?.status === 401) router.push("/login");
        } finally {
            setLoading(false);
        }
    }, [token, router]);

    useEffect(() => {
        if (!authLoading && token) fetchTemplates();
    }, [token, authLoading, fetchTemplates]);

    const handleReactivateClick = (id: number, name: string) => {
        openConfirm(`'${name}' 메뉴를 다시 활성화 하시겠습니까?`, () => executeReactivate(id));
    };

    const executeReactivate = async (id: number) => {
        if (!token) return;
        try {
            await updatePermissionTemplateStatus(token, id, true);
            showToast("정상적으로 활성화 되었습니다.", "success");
            fetchTemplates();
        } catch {
            showToast("활성화 작업에 실패했습니다.", "error");
        }
    };

    const handleDeleteClick = (id: number, name: string) => {
        openConfirm(`'${name}' 메뉴를 비활성화하시겠습니까?`, () => executeDelete(id));
    };

    const executeDelete = async (id: number) => {
        if (!token) return;
        try {
            await deletePermissionTemplate(token, id);
            showToast("비활성화 처리가 완료되었습니다.", "success");
            fetchTemplates();
        } catch {
            showToast("처리에 실패했습니다.", "error");
        }
    };

    const handleSave = async () => {
        if (!token) return;
        try {
            const payload = {
                menu_name: menuName,
                menu_code: menuCode,
                actions: actions
                    .filter(a => a.name && a.code)
                    .map(a => ({ id: a.id, name: a.name, code: a.code, is_active: a.is_active })),
            };
            await savePermissionTemplate(token, payload);
            showToast("DB에 성공적으로 반영되었습니다.", "success");
            setIsDrawerOpen(false);
            fetchTemplates();
        } catch {
            showToast("저장 중 오류가 발생했습니다.", "error");
        }
    };

    const openDrawer = (data: any = null) => {
        if (data) {
            setMenuName(data.name);
            setMenuCode(data.code);
            setActions(data.children && data.children.length > 0
                ? data.children.map((c: any) => ({ id: c.id, name: c.name, code: c.code, is_active: c.is_active ?? true }))
                : [{ id: null, name: "", code: "", is_active: true }]
            );
            setIsEditMode(true);
        } else {
            setMenuName(""); setMenuCode("");
            setActions([{ id: null, name: "", code: "", is_active: true }]);
            setIsEditMode(false);
        }
        setIsDrawerOpen(true);
    };

    const addAction = () => setActions(prev => [...prev, { id: null, name: "", code: "", is_active: true }]);
    const removeAction = (index: number) => setActions(prev => prev.filter((_, i) => i !== index));
    const updateAction = (index: number, field: string, value: any) => {
        setActions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    return {
        templates, loading,
        isDrawerOpen, setIsDrawerOpen,
        isEditMode,
        menuName, setMenuName,
        menuCode, setMenuCode,
        actions,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
        handleReactivateClick, handleDeleteClick, handleSave,
        openDrawer, addAction, removeAction, updateAction,
    };
}
