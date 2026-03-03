"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useAccessDenied } from "@/hooks/useAccessDenied";
import { hasPermission } from "@/lib/auth";
import { useUserData } from "@/hooks/useUserData";
import { useUserPermissions } from "@/hooks/useUserPermissions";

import "@/styles/templates/user.css";
import Toast from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import AccessDeniedModal from "@/components/common/AccessDeniedModal";
import UserFormModal from "@/components/user/UserFormModal";
import UserPermissionModal from "@/components/user/UserPermissionModal";

interface UserTemplateProps {
    onAccessDenied?: () => void;
}

export default function UserTemplate({ onAccessDenied }: UserTemplateProps) {
    const { token, isSystemAdmin, companyId, isLoading: authLoading } = useAuth();
    const { toast, showToast } = useToast();
    const { isDenied, isChecking } = useAccessDenied({ requiredPermission: "agent" });

    const canViewUsers      = isSystemAdmin || hasPermission("agent-detail");
    const canCreateUser     = isSystemAdmin || hasPermission("agent-create");
    const canUpdateUser     = isSystemAdmin || hasPermission("agent-update");
    const canDeleteUser     = isSystemAdmin || hasPermission("agent-delete");
    const canViewPermission = isSystemAdmin || hasPermission("agent-permission");
    const canUpsertPermission = isSystemAdmin || hasPermission("agent-permission-upsert");

    const {
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
    } = useUserData({ token, isSystemAdmin, companyId, authLoading, showToast });

    const {
        isPermModalOpen, setIsPermModalOpen,
        permTargetUser, permTemplates, permChecked,
        permLoading, permSaving,
        openPermModal, handleMenuToggle, handlePermToggle, handlePermSave,
    } = useUserPermissions({ token, showToast });

    useEffect(() => {
        console.log('[UserTemplate] 권한 체크 상태 - isChecking:', isChecking, 'isDenied:', isDenied);
    }, [isChecking, isDenied]);

    if (isChecking) {
        return (
            <div className="user-container">
                <div className="user-col user-col-list">
                    <div className="user-header">
                        <h3 className="user-title">사용자 관리</h3>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>권한 확인 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-container">
            <AccessDeniedModal
                isOpen={isDenied}
                message="사용자 관리 페이지 접근 권한이 없습니다."
                redirectPath="/"
                onRedirect={onAccessDenied}
            />
            <Toast toast={toast} />
            <ConfirmModal
                isOpen={confirmOpen}
                message={confirmMessage}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />

            {!isDenied && (
                <>
                    <section className="user-col user-col-list">
                        {/* 헤더 */}
                        <div className="user-header">
                            <h3 className="user-title">사용자 관리</h3>
                            <div className="user-header-actions">
                                <div className="user-view-toggle">
                                    <button onClick={() => setViewMode("card")} className={`user-view-toggle-btn ${viewMode === "card" ? "active" : ""}`}>📋 카드</button>
                                    <button onClick={() => setViewMode("table")} className={`user-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}>📊 테이블</button>
                                </div>
                                {canCreateUser && (
                                    <button onClick={() => openModal()} className="user-add-btn">+ 신규 등록</button>
                                )}
                            </div>
                        </div>

                        {/* 검색/필터 바 */}
                        <div className="user-search-filter-bar">
                            {isSystemAdmin && (
                                <select value={selectedCompanyId || ''} onChange={e => setSelectedCompanyId(Number(e.target.value))} className="user-company-select">
                                    <option value="">업체 선택</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                            <input value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} placeholder="🔍 이름 또는 계정 검색" className="user-search-input" />
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="user-filter-select">
                                <option value="all">전체 권한</option>
                                <option value="AGENT">상담원</option>
                                <option value="MANAGER">매니저</option>
                                <option value="SYSTEM_ADMIN">시스템 관리자</option>
                            </select>
                            <select value={sortField} onChange={e => handleSort(e.target.value as any)} className="user-sort-select">
                                <option value="created_at">생성일순</option>
                                <option value="name">이름순</option>
                                <option value="username">계정순</option>
                                <option value="role">권한순</option>
                            </select>
                            <button onClick={() => handleSort(sortField)} className="user-sort-order-btn" title={sortOrder === "asc" ? "오름차순" : "내림차순"}>
                                {sortOrder === "asc" ? "↑" : "↓"}
                            </button>
                            <label className="user-checkbox-wrapper">
                                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="user-checkbox" />
                                <span className="user-checkbox-label">비활성 포함</span>
                            </label>
                        </div>

                        {/* 결과 개수 */}
                        <div className="user-results-count">
                            총 {filteredAndSortedUsers.length}명 | {currentPage} / {totalPages || 1} 페이지
                        </div>

                        {/* 리스트 영역 */}
                        <div className="user-list-container">
                            {!canViewUsers && (
                                <div className="user-empty-state">
                                    <div className="user-empty-icon">🔒</div>
                                    <h3 className="user-empty-title">조회 권한이 없습니다</h3>
                                    <p className="user-empty-description">사용자 목록을 조회할 권한이 없습니다. 관리자에게 문의하세요.</p>
                                </div>
                            )}

                            {canViewUsers && loading && (
                                <div className="user-loading-container">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={`skeleton-${i}`} className="user-skeleton-card">
                                            <div className="user-skeleton-line user-skeleton-line-short" />
                                            <div className="user-skeleton-line user-skeleton-line-long" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {canViewUsers && !loading && filteredAndSortedUsers.length === 0 && (
                                <div className="user-empty-state">
                                    <div className="user-empty-icon">👤</div>
                                    <h3 className="user-empty-title">사용자가 없습니다</h3>
                                    <p className="user-empty-description">조건에 맞는 사용자가 없습니다. 새로운 사용자를 등록해보세요.</p>
                                    {canCreateUser && <button onClick={() => openModal()} className="user-empty-action">+ 신규 사용자 등록</button>}
                                </div>
                            )}

                            {/* 카드 뷰 */}
                            {canViewUsers && !loading && viewMode === "card" && paginatedUsers.length > 0 && (
                                <div className="user-card-list">
                                    {paginatedUsers.map(user => (
                                        <div key={user.id} className="user-card">
                                            <div className="user-card-content">
                                                <div className="user-card-header">
                                                    <span className="user-card-name">{user.name}</span>
                                                    <span className="user-card-username">@{user.username}</span>
                                                    <span className="user-card-role-badge" style={{ background: getRoleBadgeColor(user.role) }}>
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                    {user.is_active === false && <span className="user-card-inactive-badge">비활성</span>}
                                                </div>
                                                <div className="user-card-info">
                                                    내선: {user.extension || '-'} | 소속: {companies.find(c => c.id === user.company_id)?.name || '알 수 없음'}
                                                </div>
                                            </div>
                                            <div className="user-card-actions">
                                                {canViewPermission && <button onClick={() => openPermModal(user)} className="user-card-perm-btn">🔑 권한</button>}
                                                {canUpdateUser && <button onClick={() => openModal(user)} disabled={saving} className="user-card-edit-btn">✏️ 수정</button>}
                                                {canDeleteUser && (
                                                    user.is_active === false
                                                        ? <button onClick={() => handleRestoreClick(user)} disabled={restoringId === user.id} className="user-card-restore-btn">{restoringId === user.id ? '♻️ 복구 중...' : '♻️ 재활성화'}</button>
                                                        : <button onClick={() => handleDeleteClick(user)} disabled={deletingId === user.id} className="user-card-delete-btn">{deletingId === user.id ? '🗑️ 삭제 중...' : '🗑️ 삭제'}</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 테이블 뷰 */}
                            {canViewUsers && !loading && viewMode === "table" && paginatedUsers.length > 0 && (
                                <div className="user-table-container">
                                    <table className="user-table">
                                        <thead>
                                            <tr>
                                                <th>이름</th><th>계정</th><th>내선</th><th>권한</th><th>상태</th><th>소속</th><th className="center">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedUsers.map(user => (
                                                <tr key={user.id}>
                                                    <td className="name">{user.name}</td>
                                                    <td>@{user.username}</td>
                                                    <td>{user.extension || '-'}</td>
                                                    <td><span className="user-table-role-badge" style={{ background: getRoleBadgeColor(user.role) }}>{getRoleLabel(user.role)}</span></td>
                                                    <td><span className={`user-table-status-badge ${user.is_active === false ? 'inactive' : 'active'}`}>{user.is_active === false ? '비활성' : '활성'}</span></td>
                                                    <td>{companies.find(c => c.id === user.company_id)?.name || '-'}</td>
                                                    <td className="center">
                                                        <div className="user-table-actions">
                                                            {canViewPermission && <button onClick={() => openPermModal(user)} className="user-table-perm-btn" title="권한 설정">🔑</button>}
                                                            {canUpdateUser && <button onClick={() => openModal(user)} className="user-table-edit-btn">✏️</button>}
                                                            {canDeleteUser && (
                                                                user.is_active === false
                                                                    ? <button onClick={() => handleRestoreClick(user)} disabled={restoringId === user.id} className="user-table-restore-btn" title="재활성화">♻️</button>
                                                                    : <button onClick={() => handleDeleteClick(user)} disabled={deletingId === user.id} className="user-table-delete-btn">🗑️</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 페이지네이션 */}
                        {!loading && filteredAndSortedUsers.length > 0 && (
                            <div className="user-pagination">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="user-pagination-btn">← 이전</button>
                                <div className="user-pagination-pages">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                                        .map((page, idx, arr) => {
                                            if (idx > 0 && page - arr[idx - 1] > 1) return <span key={`ellipsis-${idx}`} className="user-pagination-ellipsis">...</span>;
                                            return <button key={page} onClick={() => setCurrentPage(page)} className={`user-pagination-page-btn ${currentPage === page ? 'active' : ''}`}>{page}</button>;
                                        })}
                                </div>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="user-pagination-btn">다음 →</button>
                            </div>
                        )}
                    </section>

                    {/* 생성/수정 모달 */}
                    <UserFormModal
                        isOpen={isModalOpen}
                        isEditMode={isEditMode}
                        formData={formData}
                        companies={companies}
                        saving={saving}
                        canCreateUser={canCreateUser}
                        canUpdateUser={canUpdateUser}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        onFormChange={setFormData}
                    />

                    {/* 권한 설정 모달 */}
                    <UserPermissionModal
                        isOpen={isPermModalOpen}
                        targetUser={permTargetUser}
                        permTemplates={permTemplates}
                        permChecked={permChecked}
                        permLoading={permLoading}
                        permSaving={permSaving}
                        canUpsertPermission={canUpsertPermission}
                        onClose={() => setIsPermModalOpen(false)}
                        onSave={handlePermSave}
                        onMenuToggle={handleMenuToggle}
                        onPermToggle={handlePermToggle}
                    />
                </>
            )}
        </div>
    );
}
