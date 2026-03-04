"use client";

import { useState, useMemo } from "react";
import type { Customer, CustomerGroup, CallHistory } from "@/types/customer";

export const GROUPS: CustomerGroup[] = [
    { id: "all",       label: "전체",      color: "#6b7280" },
    { id: "vip",       label: "VIP",       color: "#f59e0b" },
    { id: "normal",    label: "일반",      color: "#3b82f6" },
    { id: "blacklist", label: "블랙리스트", color: "#ef4444" },
];

export const MOCK_CALLS: CallHistory[] = [
    { id: "1", date: "2026-02-20T10:30:00", direction: "inbound",  duration: "5분 23초" },
    { id: "2", date: "2026-02-15T14:20:00", direction: "outbound", duration: "2분 10초" },
    { id: "3", date: "2026-02-10T09:00:00", direction: "inbound",  duration: "0초"      },
];

const MOCK_CUSTOMERS: Customer[] = [
    { id: "1", name: "김민수", phone: "010-1234-5678", email: "minsu@example.com",  company: "테스트 주식회사", group: "vip",       memo: "VIP 우대 고객",         createdAt: "2025-01-15", lastCallAt: "2026-02-20T10:30:00" },
    { id: "2", name: "이영희", phone: "010-9876-5432", email: "young@gmail.com",    company: "서울 컨설팅",    group: "normal",    memo: "",                     createdAt: "2025-03-22", lastCallAt: "2026-02-18T14:20:00" },
    { id: "3", name: "박철수", phone: "02-1234-5678",  email: "chul@company.co.kr", company: "글로벌 무역",    group: "normal",    memo: "정기 AS 고객",          createdAt: "2025-05-10", lastCallAt: "2026-01-30T09:15:00" },
    { id: "4", name: "최수진", phone: "010-5555-7777", email: "sujin@example.com",  company: "스마트 솔루션",  group: "vip",       memo: "월 평균 통화 30회 이상", createdAt: "2024-11-05", lastCallAt: "2026-02-25T16:45:00" },
    { id: "5", name: "정대한", phone: "031-888-9999",  email: "",                   company: "",               group: "blacklist", memo: "스팸 발신 이력",        createdAt: "2026-01-08", lastCallAt: "2026-02-10T11:00:00" },
    { id: "6", name: "윤미래", phone: "010-2222-3333", email: "mirae@tech.com",     company: "미래 기술",      group: "normal",    memo: "",                     createdAt: "2025-08-20", lastCallAt: "2026-02-22T13:30:00" },
    { id: "7", name: "강동원", phone: "010-4444-8888", email: "dongwon@biz.com",    company: "강동 물산",      group: "vip",       memo: "기업 계약 고객",        createdAt: "2024-09-12", lastCallAt: "2026-02-24T10:00:00" },
];

const DEFAULT_NEW: Partial<Customer> = { name: "", phone: "", email: "", company: "", group: "normal", memo: "" };

export function useCustomerData() {
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [selectedGroup, setSelectedGroup] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newForm, setNewForm] = useState<Partial<Customer>>(DEFAULT_NEW);

    const groupCounts = useMemo(() => {
        const counts: Record<string, number> = { all: customers.length };
        customers.forEach(c => { counts[c.group] = (counts[c.group] || 0) + 1; });
        return counts;
    }, [customers]);

    const filtered = useMemo(() => {
        return customers.filter(c => {
            if (selectedGroup !== "all" && c.group !== selectedGroup) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !c.name.toLowerCase().includes(q) &&
                    !c.phone.toLowerCase().includes(q) &&
                    !c.company.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [customers, selectedGroup, search]);

    const selectedCustomer = customers.find(c => c.id === selectedId) ?? null;

    const getGroupLabel = (id: string) => GROUPS.find(g => g.id === id)?.label ?? id;
    const getGroupColor = (id: string) => GROUPS.find(g => g.id === id)?.color ?? "#6b7280";

    function handleSelectGroup(id: string) {
        setSelectedGroup(id);
        setSelectedId(null);
    }

    function handleSelect(id: string) {
        setSelectedId(id);
        setEditMode(false);
    }

    function handleEditStart() {
        if (!selectedCustomer) return;
        setEditForm({ ...selectedCustomer });
        setEditMode(true);
    }

    function handleEditCancel() {
        setEditMode(false);
        setEditForm({});
    }

    function handleEditSave() {
        if (!selectedCustomer) return;
        setCustomers(prev =>
            prev.map(c => c.id === selectedCustomer.id ? { ...c, ...editForm } as Customer : c)
        );
        setEditMode(false);
        setEditForm({});
    }

    function handleDelete() {
        if (!selectedCustomer) return;
        setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
        setSelectedId(null);
    }

    function handleAddOpen() {
        setNewForm(DEFAULT_NEW);
        setShowAddModal(true);
    }

    function handleAddSave() {
        if (!newForm.name || !newForm.phone) return;
        const id = String(Date.now());
        setCustomers(prev => [...prev, {
            id,
            name: newForm.name!,
            phone: newForm.phone!,
            email: newForm.email ?? "",
            company: newForm.company ?? "",
            group: newForm.group ?? "normal",
            memo: newForm.memo ?? "",
            createdAt: new Date().toISOString().slice(0, 10),
            lastCallAt: null,
        }]);
        setShowAddModal(false);
    }

    return {
        GROUPS,
        MOCK_CALLS,
        groupCounts,
        filtered,
        selectedCustomer,
        selectedId,
        selectedGroup,
        search, setSearch,
        editMode,
        editForm, setEditForm,
        showAddModal, setShowAddModal,
        newForm, setNewForm,
        getGroupLabel,
        getGroupColor,
        handleSelectGroup,
        handleSelect,
        handleEditStart, handleEditCancel, handleEditSave,
        handleDelete,
        handleAddOpen, handleAddSave,
    };
}
