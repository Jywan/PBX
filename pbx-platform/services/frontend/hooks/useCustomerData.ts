"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/lib/api/customers";
import { fetchCompanies } from "@/lib/api/companies";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import type { Customer, CustomerGroup, CallHistory } from "@/types/customer";
import type { Company } from "@/types/company";

const GROUPS: CustomerGroup[] = [
    { id: "all",       label: "전체",      color: "#6b7280" },
    { id: "vip",       label: "VIP",       color: "#f59e0b" },
    { id: "normal",    label: "일반",      color: "#3b82f6" },
    { id: "blacklist", label: "블랙리스트", color: "#ef4444" },
];

const MOCK_CALLS: CallHistory[] = [];

const EMPTY_FORM: Partial<Customer> = {
    name: "", phone: "", email: null, company_id: null, group: "normal", memo: null,
};

type Params = {
    token: string | null;
    showToast: (message: string, type: "success" | "error") => void;
    isSystemAdmin: boolean;
    companyId: number | null;
};

export function useCustomerData({ token, showToast, isSystemAdmin, companyId }: Params) {
    const { isOpen: confirmOpen, message: confirmMessage, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [search, setSearch] = useState("");

    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    const [showAddModal, setShowAddModal] = useState(false);
    const [newForm, setNewForm] = useState<Partial<Customer>>(EMPTY_FORM);

    const selectedCustomer = customers.find(c => c.id === selectedId) ?? null;

    const groupCounts = useMemo(() => {
        const counts: Record<string, number> = { all: customers.length };
        for (const c of customers) {
            counts[c.group] = (counts[c.group] ?? 0) + 1;
        }
        return counts;
    }, [customers]);

    const filtered = useMemo(() => {
        let result = customers;
        if (selectedGroup !== "all") result = result.filter(c => c.group === selectedGroup);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                (c.company_name && c.company_name.toLowerCase().includes(q))
            );
        }
        return result;
    }, [customers, selectedGroup, search]);

    const loadCustomers = async () => {
        if (!token) return;
        try {
            setCustomers(await fetchCustomers(token));
        } catch {
            showToast("고객 데이터 로딩 실패", "error");
        }
    };

    const loadCompanies = async () => {
        if (!token) return;
        try {
            setCompanies(await fetchCompanies(token));
        } catch { /* 드롭다운 빈 목록으로 유지 */ }
    };

    useEffect(() => {
        loadCustomers();
        loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const getGroupLabel = (id: string) => GROUPS.find(g => g.id === id)?.label ?? id;
    const getGroupColor = (id: string) => GROUPS.find(g => g.id === id)?.color ?? "#6b7280";

    const handleSelectGroup = (id: string) => { setSelectedGroup(id); setSelectedId(null); };
    const handleSelect = (id: number) => { setSelectedId(id); setEditMode(false); };

    const handleEditStart = () => {
        if (!selectedCustomer) return;
        setEditForm({ ...selectedCustomer });
        setEditMode(true);
    };

    const handleEditCancel = () => { setEditMode(false); setEditForm({}); };

    const handleEditSave = async () => {
        if (!selectedCustomer || !token) return;
        try {
            await updateCustomer(token, selectedCustomer.id, {
                name: editForm.name,
                phone: editForm.phone ? editForm.phone.replace(/-/g, "") : undefined,
                email: editForm.email ?? undefined,
                company_id: editForm.company_id ?? undefined,
                group: editForm.group,
                memo: editForm.memo ?? undefined,
            });
            showToast("저장되었습니다.", "success");
            setEditMode(false);
            await loadCustomers();
        } catch {
            showToast("저장 실패", "error");
        }
    };

    const handleDelete = () => {
        if (!selectedCustomer || !token) return;
        openConfirm(`${selectedCustomer.name} 고객을 삭제하시겠습니까?`, async () => {
            try {
                await deleteCustomer(token, selectedCustomer.id);
                showToast("삭제되었습니다.", "success");
                setSelectedId(null);
                await loadCustomers();
            } catch {
                showToast("삭제 실패", "error");
            }
        });
    };

    const handleAddOpen = () => {
        setNewForm(isSystemAdmin ? EMPTY_FORM : { ...EMPTY_FORM, company_id: companyId });
        setShowAddModal(true);
    };

    const handleAddSave = async () => {
        if (!newForm.name || !newForm.phone) {
            showToast("이름과 전화번호는 필수입니다.", "error");
            return;
        }
        if (!token) return;
        try {
            await createCustomer(token, {
                name: newForm.name,
                phone: newForm.phone.replace(/-/g, ""),
                email: newForm.email ?? undefined,
                company_id: newForm.company_id ?? undefined,
                group: newForm.group,
                memo: newForm.memo ?? undefined,
            });
            showToast("고객이 추가되었습니다.", "success");
            setShowAddModal(false);
            await loadCustomers();
        } catch {
            showToast("추가 실패", "error");
        }
    };

    return {
        GROUPS, MOCK_CALLS, companies, isSystemAdmin,
        groupCounts, filtered, selectedCustomer, selectedId,
        selectedGroup, search, setSearch,
        editMode, editForm, setEditForm,
        showAddModal, setShowAddModal,
        newForm, setNewForm,
        getGroupLabel, getGroupColor,
        handleSelectGroup, handleSelect,
        handleEditStart, handleEditCancel, handleEditSave,
        handleDelete, handleAddOpen, handleAddSave,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
    };
}
