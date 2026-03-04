"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchCompanies as apiFetchCompanies, createCompany, updateCompany, deactivateCompany } from "@/lib/api/companies";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPhoneNumber, validatePhoneNumber, validateBusinessNumber, formatBusinessNumber, 
    validateEmail, validateFaxNumber, formatFaxNumber } from "@/lib/utils/validation";
import { hasPermission } from "@/lib/auth";
import type { Company, CompanyFormState } from "@/types/company";

type Params = {
    token: string | null;
    isSystemAdmin: boolean;
    companyId: number | null;
    showToast: (message: string, type: "success" | "error") => void;
}

const EMPTY_FORM: CompanyFormState = {
    id: null, name: "", representative: "", contact: "",
    callback: false, active: true, businessNumber: "",
    address: "", addressDetail: "", postalCode: "", email: "", fax: ""
}

export function useCompanyData({ token, isSystemAdmin, companyId, showToast }: Params) {
    const router = useRouter();
    const { isOpen: confirmOpen, message: confirmMessage, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);

    const [searchTerm, setSearchTerm] = useState("");
    const debounceSearchTerm = useDebounce(searchTerm, 300);
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [sortBy, setSortBy] = useState<"latest" | "oldest" | "name">("latest");

    const handleSelectCompany = (comp: Company) => {
        setSelectedId(comp.id);
        setForm({
            id: comp.id,
            name: comp.name,
            representative: comp.representative || "",
            contact: comp.contact || "",
            callback: comp.callback || false,
            active: comp.active,
            businessNumber: comp.businessNumber || "",
            address: comp.address || "",
            addressDetail: comp.addressDetail || "",
            postalCode: comp.postalCode || "",
            email: comp.email || "",
            fax: comp.fax || "",
        });
    };

    const fetchCompanies = async () => {
        if (!token) return;
        if (!isSystemAdmin && !hasPermission("company-detail")) return;
        setLoading(true);
        try {
            const data = await apiFetchCompanies(token);
            const filtered = isSystemAdmin ? data : data.filter(c => c.id === companyId);
            setCompanies(filtered);
            if (filtered.length > 0 && !selectedId) {
                handleSelectCompany(filtered[0]);
            }
        } catch (e: any) {
            console.error(e);
            if (e.response?.status === 401) {
                showToast("인증이 만료되었습니다. 다시 로그인해주세요.", "error");
                setTimeout(() => router.push("/login"), 1500);
            } else {
                showToast("데이터 로딩 실패", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchCompanies(); 
    }, [token]);

    const filteredCompanies = useMemo(() => {
        let result = [...companies];
        if (debounceSearchTerm.trim()) {
            const term = debounceSearchTerm.toLowerCase();
            result = result.filter(comp => 
                comp.name.toLowerCase().includes(term) ||
                (comp.representative && comp.representative.toLowerCase().includes(term))
            );
        }
        if (filterStatus === "active") result = result.filter(c => c.active);
        else if (filterStatus === "inactive") result = result.filter(c => !c.active);
        if (sortBy === "latest") result.sort((a, b) => b.id - a.id);
        else if (sortBy === "oldest") result.sort((a, b) => a.id - b.id);
        else if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        return result;
    }, [companies, debounceSearchTerm, filterStatus, sortBy]);

    const handleCreateNew = () => {
        setSelectedId(null);
        setForm(EMPTY_FORM);
    };

    const handleContactChange = (value: string) => {
        setForm(prev => ({ ...prev, contact: formatPhoneNumber(value) }));
    };

    const handleBusinessNumberChange = (value: string) => {
        setForm(prev => ({ ...prev, businessNumber: formatBusinessNumber(value) }));
    };

    const handleFaxChange = (value: string) => {
        setForm(prev => ({ ...prev, fax: formatFaxNumber(value) }));
    };

    const handleSave = async () => {
        if (!form.name) return showToast("업체명은 필수입니다.", "error");
        if (!token) return;
        if (form.contact && !validatePhoneNumber(form.contact)) return showToast("올바른 전화번호 형식이 아닙니다. (예 010-1234-5678)", "error");
        if (form.businessNumber && !validateBusinessNumber(form.businessNumber)) return showToast("올바른 사업자등록번호 형식이 아닙니다. (예 123-45-67890)", "error");
        if (form.email && !validateEmail(form.email)) return showToast("올바른 이메일 형식이 아닙니다.", "error");
        if (form.fax && !validateFaxNumber(form.fax)) return showToast("올바른 팩스번호 형식이 아닙니다. (예 02-1234-5678)", "error");
        try {
            if (form.id) {
                await updateCompany(token, form.id, form);
                showToast("저장되었습니다.", "success");
            } else {
                await createCompany(token, form);
                showToast("신규 등록 완료", "success");
            }
            fetchCompanies();
        } catch (e: any) {
            console.error(e);
            showToast("저장 실패: " + (e.response?.data?.detail || "오류 발생"), "error");
        }
    };

    const handleDelete = () => {
        if (!form.id || !token) return;
        openConfirm(`${form.name} 업체를 비활성화(삭제) 하시겠습니까?`, async () => {
            try {
                await deactivateCompany(token, form.id!);
                showToast("업체가 비활성화 되었습니다.", "success");
                fetchCompanies();
            } catch (e: any) {
                showToast("처리 실패", "error");
            }
        });
    };

    const handleRestore = () => {
        if (!form.id || !token) return;
        openConfirm(`${form.name} 업체를 활성화 하시겠습니까?`, async () => {
            try {
                await updateCompany(token, form.id!, { active: true });
                showToast("업체가 활성화 되었습니다.", "success");
                fetchCompanies();
            } catch (e: any) {
                showToast("처리 실패", "error");
            }
        });
    };

    return {
        companies,
        filteredCompanies,
        selectedId,
        loading,
        form, setForm,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        sortBy, setSortBy,
        handleSelectCompany, handleCreateNew,
        handleContactChange, handleBusinessNumberChange, handleFaxChange,
        handleSave, handleDelete, handleRestore,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
    };
}