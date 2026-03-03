"use client";

import { useState } from "react";
import { fetchPermissionTemplates, fetchUserPermissions, assignUserPermissions } from "@/lib/api/permissions";
import type { User } from "@/types/user";


type Params = {
    token: string | null;
    showToast: (message: string, type: "success" | "error") => void;
};

export function useUserPermissions({ token, showToast }: Params) {
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [permTargetUser, setPermTargetUser] = useState<User | null>(null);
    const [permTemplates, setPermTemplates] = useState<any[]>([]);
    const [permChecked, setPermChecked] = useState<Set<number>>(new Set());
    const [permLoading, setPermLoading] = useState(false);
    const [permSaving, setPermSaving] = useState(false);

    const openPermModal = async (user: User) => {
        if (!token) return;
        setPermTargetUser(user);
        setIsPermModalOpen(true);
        setPermLoading(true);
        try {
            const [templates, userPermIds] = await Promise.all([
                fetchPermissionTemplates(token),
                fetchUserPermissions(token, user.id),
            ]);
            setPermTemplates(templates);
            setPermChecked(new Set(userPermIds));
        } catch (e: any) {
            console.error(e);
            showToast("권한 정보를 불러오는 중 오류가 발생했습니다.", "error");
            setIsPermModalOpen(false);
        } finally {
            setPermLoading(false);
        }
    };

    const handleMenuToggle = (menuId: number) => {
        setPermChecked((prev) => {
            const next = new Set(prev);
            if (next.has(menuId)) next.delete(menuId);
            else next.add(menuId);
            return next;
        });
    };

    const handlePermToggle = (permId: number) => {
        setPermChecked(prev => {
            const next = new Set(prev);
            if (next.has(permId)) next.delete(permId);
            else next.add(permId);
            return next;
        });
    };

    const handlePermSave = async () => {
        if (!token || !permTargetUser) return;
        setPermSaving(true);
        try {
            for (const menu of permTemplates) {
                if (!menu.is_active) continue;
                const permissionIds: number[] = [];
                if (permChecked.has(menu.id)) permissionIds.push(menu.id);
                (menu.children || [])
                    .filter((action: any) => action.is_active && permChecked.has(action.id))
                    .forEach((action: any) => permissionIds.push(action.id));
                await assignUserPermissions(token, {
                    user_id: permTargetUser.id,
                    menu_id: menu.id,
                    permission_ids: permissionIds,
                });
            }
            showToast(`'${permTargetUser.name}' 권한이 저장되었습니다.`, "success");
            setIsPermModalOpen(false);
        } catch (e: any) {
            console.error(e);
            showToast("권한 저장 중 오류가 발생했습니다.", "error");
        } finally {
            setPermSaving(false);
        }
    };

    return {
        isPermModalOpen, setIsPermModalOpen,
        permTargetUser, permTemplates, permChecked,
        permLoading, permSaving,
        openPermModal, handleMenuToggle, handlePermToggle, handlePermSave,
    }
}