"use client";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useAccessDenied } from "@/hooks/useAccessDenied";
import { hasPermission } from "@/lib/auth";
import { useCompanyData } from "@/hooks/useCompanyData";

import "@/styles/templates/company.css";
import Toast from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import AccessDeniedModal from "@/components/common/AccessDeniedModal";
import CompanyList from "@/components/company/CompanyList";
import CompanyForm from "@/components/company/CompanyForm";
import CompanyExtra from "@/components/company/CompanyExtra";

interface CompanyTemplateProps {
    onAccessDenied?: () => void;
}

export default function CompanyTemplate({ onAccessDenied }: CompanyTemplateProps) {
    const { token, isSystemAdmin, companyId, isLoading } = useAuth();
    const { toast, showToast } = useToast();
    const { isDenied, isChecking } = useAccessDenied({ requiredPermission: "company" });

    const canViewCompanies = isSystemAdmin || hasPermission("company-detail");
    const canCreateCompany = isSystemAdmin || hasPermission("company-create");
    const canUpdateCompany = isSystemAdmin || hasPermission("company-update");
    const canDeleteCompany = isSystemAdmin || hasPermission("company-delete");

    const {
        companies, filteredCompanies, selectedId, loading,
        form, setForm,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        sortBy, setSortBy,
        handleSelectCompany, handleCreateNew,
        handleContactChange, handleBusinessNumberChange, handleFaxChange,
        handleSave, handleDelete, handleRestore,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
    } = useCompanyData({ token, isSystemAdmin, companyId, showToast });

    if (isLoading) {
        return <div style={{ textAlign: "center", padding: "50px" }}>로딩 중...</div>;
    }

    if (isChecking) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>권한 확인중...</p>
            </div>
        );
    }

    return (
        <div className="company-container">
            <AccessDeniedModal
                isOpen={isDenied}
                message="업체관리 페이지 접근 권한이 없습니다."
                redirectPath="/"
                onRedirect={onAccessDenied}
            />

            {!isDenied && (
                <>
                    <Toast toast={toast} />
                    <ConfirmModal
                        isOpen={confirmOpen}
                        title="비활성화 확인"
                        message={confirmMessage}
                        onConfirm={onConfirm}
                        onClose={closeConfirm}
                    />
                    <CompanyList
                        companies={companies}
                        filteredCompanies={filteredCompanies}
                        selectedId={selectedId}
                        loading={loading}
                        canViewCompanies={canViewCompanies}
                        canCreateCompany={canCreateCompany}
                        searchTerm={searchTerm}
                        filterStatus={filterStatus}
                        sortBy={sortBy}
                        onSearchChange={setSearchTerm}
                        onFilterChange={setFilterStatus}
                        onSortChange={setSortBy}
                        onSelectCompany={handleSelectCompany}
                        onCreateNew={handleCreateNew}
                    />
                    <CompanyForm
                        form={form}
                        setForm={setForm}
                        companies={companies}
                        selectedId={selectedId}
                        canCreateCompany={canCreateCompany}
                        canUpdateCompany={canUpdateCompany}
                        canDeleteCompany={canDeleteCompany}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        onContactChange={handleContactChange}
                        onBusinessNumberChange={handleBusinessNumberChange}
                        onFaxChange={handleFaxChange}
                    />
                    <CompanyExtra
                        form={form}
                        setForm={setForm}
                        selectedId={selectedId}
                        companies={companies}
                        canCreateCompany={canCreateCompany}
                        canUpdateCompany={canUpdateCompany}
                    />
                </>
            )}
        </div>
    );
}
