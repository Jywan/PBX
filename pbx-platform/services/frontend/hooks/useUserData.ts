"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchUsers, createUser, updateUser, deleteUser,restoreUser } from "@/lib/api/users";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { hasPermission } from "@/lib/auth";
import type { User, UserFormState } from "@/types/user";
import type { Company } from "@/types/company";

export type ViewMode = "card" | "table";
export type SortField = "name" | "created_at" | "role" | "username";
export type SortOrder = "asc" | "desc";

type Params = {
    token: string | null;
    isSystemAdmin: boolean;
    companyId: number | null;
    authLoading: boolean;
    showToast: (message: string, type: "success" | "error") => void;
};

export function useUserData({ token, isSystemAdmin, companyId, authLoading, showToast }: Params) {
    const router = useRouter();
    const { isOpen: confirmOpen, message: confirmMessage, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [restoringId, setRestoringId] = useState<number | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<UserFormState>({
        id: null,
        username: "",
        password: "",
        name: "",
        extension: "",
        role: "AGENT",
        company_id: "",
    })

    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [showInactive, setShowInactive] = useState(false);
    const [sortField, setSortField] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchInitialData = useCallback(async () => {
        if (!token) return;
        if (!isSystemAdmin && !hasPermission("agent-detail")) return;

        setLoading(true);
        try {
            const companiesList = await fetchCompanies(token);

            if (isSystemAdmin) {
                setCompanies(companiesList);
                if (!selectedCompanyId) {
                    setUsers([]);
                    setLoading(false);
                    return;
                }
            } else {
                setCompanies(companiesList.filter(c => c.id === companyId));
            }

            const usersList = await fetchUsers(token, isSystemAdmin ? (selectedCompanyId || undefined) : (companyId || undefined));
            setUsers(usersList);
        } catch (e: any) {
            console.error(e);
            if (e.response?.status == 401) router.push("/login");
        } finally {
            setLoading(false);
        }
    }, [token, isSystemAdmin, companyId, selectedCompanyId, router]);

    useEffect(() => {
        if (token && !authLoading) fetchInitialData();
    }, [token, authLoading, fetchInitialData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, filterRole, showInactive, sortField, sortOrder]);

    const handleSave = async () => {
        if (!token) return;
        if (!formData.username || !formData.name) return showToast("이름과 사용자 이름은 필수입니다.", "error");
        if (!isEditMode && !formData.password) return showToast("비밀번호는 필수입니다.", "error");
        if (!formData.company_id) return showToast("소속 업체를 선택해주세요.", "error");

        setSaving(true);
        try {
            if (isEditMode && formData.id) {
                const updateData: any = {
                    username: formData.username,
                    name: formData.name,
                    extension: formData.extension,
                    role: formData.role,
                };
                if (formData.password) updateData.password = formData.password;
                await updateUser(token, formData.id, updateData);
                showToast("사용자 정보가 수정되었습니다.", "success");
            } else {
                await createUser(token, {
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    extension: formData.extension,
                    role: formData.role,
                    company_id: Number(formData.company_id),
                });
                showToast("신규 사용자가 생성되었습니다.", "success");
            }
            setIsModalOpen(false);
            fetchInitialData();
        } catch (e: any) {
            console.error(e);
            let errorMessage = "오류 발생";
            if (e.response?.data) {
                const errorData = e.response.data;
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail
                        .map((err: any) => (err.msg || err.message || "").replace(/^Value error,\s*/, ""))
                        .join(", ");
                } else if (typeof errorData.detail === "string") {
                    errorMessage = errorData.detail;
                }
            }
            showToast(errorMessage, "error");
        } finally {
            setSaving(false);
        }
    };

    const executeDelete = async (id: number) => {
        if (!token) return;
        setDeletingId(id);
        try {
            await deleteUser(token, id);
            showToast("사용자가 비활성화되었습니다.", "success");
            fetchInitialData();
        } catch (e: any) {
            console.error(e);
            showToast("사용자 비활성화 중 오류가 발생했습니다.", "error");
        } finally {
            setDeletingId(null);
        }
    }

    const executeRestore = async (id: number) => {
        if (!token) return;
        setRestoringId(id);
        try {
            await restoreUser(token, id);
            showToast("사용자가 재활성화되었습니다.", "success");
            fetchInitialData();
        } catch {
            showToast("사용자 재활성화 중 오류가 발생했습니다.", "error");
        } finally {
            setRestoringId(null);
        }
    };

    const handleDeleteClick = (user: User) => {
        openConfirm(`'${user.name}' 상담원을 정말 삭제(비활성) 하시겠습니까?`, () => executeDelete(user.id));
    }

    const handleRestoreClick = (user: User) => {
        openConfirm(`'${user.name}' 상담원을 재활성화 하시겠습니까?`, () => executeRestore(user.id));
    }

    const openModal = (user: User | null = null) => {
        if (user) {
            setFormData({
                id: user.id,
                username: user.username,
                password: "",
                name: user.name,
                extension: user.extension || "",
                role: user.role || "AGENT",
                company_id: user.company_id,
            });
            setIsEditMode(true);
        } else {
            setFormData({
                id: null,
                username: "",
                password: "",
                name: "",
                extension: "",
                role: "AGENT",
                company_id: isSystemAdmin ? (selectedCompanyId ?? "") : (companyId ?? ""),
            });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return "#dc2626";
            case "MANAGER": return "#f59e0b";
            case "AGENT": return "#10b981";
            default: return "#6b7280";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return "시스템 관리자";
            case "MANAGER": return "관리자";
            case "AGENT": return "상담원";
            default: return role;
        }
    };

    const filteredAndSortedUsers = users
        .filter(user => {
            if (!showInactive && user.is_active === false) return false;
            if (filterRole !== "all" && user.role !== filterRole) return false;
            const kw = searchKeyword.toLowerCase();
            if (kw) {
                const name = user.name.toLowerCase();
                const username = user.username.toLowerCase();
                if (!name.includes(kw) && !username.includes(kw)) return false;
            }
            return true;
        })
        .sort((a, b) => {
            let aValue: any = a[sortField as keyof User];
            let bValue: any = b[sortField as keyof User];
            if (sortField === "created_at") {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        });
    
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
    const paginatedUsers = filteredAndSortedUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return {
        companies, loading, saving, deletingId, restoringId,
        selectedCompanyId, setSelectedCompanyId,
        viewMode, setViewMode,
        isModalOpen, setIsModalOpen, isEditMode,
        formData, setFormData,
        searchKeyword, setSearchKeyword,
        filterRole, setFilterRole,
        showInactive, setShowInactive,
        sortField, sortOrder,
        currentPage, setCurrentPage, totalPages, paginatedUsers, filteredAndSortedUsers,
        handleSave, handleDeleteClick, handleRestoreClick, openModal, handleSort,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
        getRoleBadgeColor, getRoleLabel,
    };
}