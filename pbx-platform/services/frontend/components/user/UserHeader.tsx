"use client";

import type { Company } from "@/types/company";
import type { ViewMode, SortField, SortOrder } from "@/hooks/useUserData";

interface UserHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    canCreateUser: boolean;
    onOpenModal: () => void;
    isSystemAdmin: boolean;
    companies: Company[];
    selectedCompanyId: number | null;
    onSelectCompany: (id: number) => void;
    searchKeyword: string;
    onSearchChange: (keyword: string) => void;
    filterRole: string;
    onFilterRoleChange: (role: string) => void;
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    showInactive: boolean;
    onShowInactiveChange: (v: boolean) => void;
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

export default function UserHeader({
    viewMode, onViewModeChange, canCreateUser, onOpenModal,
    isSystemAdmin, companies, selectedCompanyId, onSelectCompany,
    searchKeyword, onSearchChange, filterRole, onFilterRoleChange,
    sortField, sortOrder, onSort, showInactive, onShowInactiveChange,
    totalCount, currentPage, totalPages,
}: UserHeaderProps) {
    return (
        <>
            <div className="user-header">
                <h3 className="user-title">사용자 관리</h3>
                <div className="user-header-actions">
                    <div className="user-view-toggle">
                        <button onClick={() => onViewModeChange("card")} className={`user-view-toggle-btn ${viewMode === "card" ? "active" : ""}`}>📋 카드</button>
                        <button onClick={() => onViewModeChange("table")} className={`user-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}>📊 테이블</button>
                    </div>
                    {canCreateUser && (
                        <button onClick={onOpenModal} className="user-add-btn">+ 신규 등록</button>
                    )}
                </div>
            </div>

            <div className="user-search-filter-bar">
                {isSystemAdmin && (
                    <select value={selectedCompanyId || ''} onChange={e => onSelectCompany(Number(e.target.value))} className="user-company-select">
                        <option value="">업체 선택</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
                <input value={searchKeyword} onChange={e => onSearchChange(e.target.value)} placeholder="🔍 이름 또는 계정 검색" className="user-search-input" />
                <select value={filterRole} onChange={e => onFilterRoleChange(e.target.value)} className="user-filter-select">
                    <option value="all">전체 권한</option>
                    <option value="AGENT">상담원</option>
                    <option value="MANAGER">매니저</option>
                    <option value="SYSTEM_ADMIN">시스템 관리자</option>
                </select>
                <select value={sortField} onChange={e => onSort(e.target.value as SortField)} className="user-sort-select">
                    <option value="created_at">생성일순</option>
                    <option value="name">이름순</option>
                    <option value="username">계정순</option>
                    <option value="role">권한순</option>
                </select>
                <button onClick={() => onSort(sortField)} className="user-sort-order-btn" title={sortOrder === "asc" ? "오름차순" : "내림차순"}>
                    {sortOrder === "asc" ? "↑" : "↓"}
                </button>
                <label className="user-checkbox-wrapper">
                    <input type="checkbox" checked={showInactive} onChange={e => onShowInactiveChange(e.target.checked)} className="user-checkbox" />
                    <span className="user-checkbox-label">비활성 포함</span>
                </label>
            </div>

            <div className="user-results-count">
                총 {totalCount}명 | {currentPage} / {totalPages || 1} 페이지
            </div>
        </>
    );
}
