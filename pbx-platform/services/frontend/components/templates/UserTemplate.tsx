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
import UserHeader from "@/components/user/UserHeader";
import UserListSection from "@/components/user/UserListSection";
import UserPagination from "@/components/user/UserPagination";

interface UserTemplateProps {
    onAccessDenied?: () => void;
}

export default function UserTemplate({ onAccessDenied }: UserTemplateProps) {
    const { token, isSystemAdmin, companyId, isLoading: authLoading } = useAuth();
    const { toast, showToast } = useToast();
    const { isDenied, isChecking } = useAccessDenied({ requiredPermission: "agent" });

    const canViewUsers        = isSystemAdmin || hasPermission("agent-detail");
    const canCreateUser       = isSystemAdmin || hasPermission("agent-create");
    const canUpdateUser       = isSystemAdmin || hasPermission("agent-update");
    const canDeleteUser       = isSystemAdmin || hasPermission("agent-delete");
    const canViewPermission   = isSystemAdmin || hasPermission("agent-permission");
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
                        <UserHeader
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            canCreateUser={canCreateUser}
                            onOpenModal={() => openModal()}
                            isSystemAdmin={isSystemAdmin}
                            companies={companies}
                            selectedCompanyId={selectedCompanyId}
                            onSelectCompany={setSelectedCompanyId}
                            searchKeyword={searchKeyword}
                            onSearchChange={setSearchKeyword}
                            filterRole={filterRole}
                            onFilterRoleChange={setFilterRole}
                            sortField={sortField}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            showInactive={showInactive}
                            onShowInactiveChange={setShowInactive}
                            totalCount={filteredAndSortedUsers.length}
                            currentPage={currentPage}
                            totalPages={totalPages}
                        />
                        <UserListSection
                            loading={loading}
                            canViewUsers={canViewUsers}
                            canCreateUser={canCreateUser}
                            canUpdateUser={canUpdateUser}
                            canDeleteUser={canDeleteUser}
                            canViewPermission={canViewPermission}
                            viewMode={viewMode}
                            paginatedUsers={paginatedUsers}
                            totalCount={filteredAndSortedUsers.length}
                            companies={companies}
                            saving={saving}
                            deletingId={deletingId}
                            restoringId={restoringId}
                            onOpenModal={openModal}
                            onDeleteClick={handleDeleteClick}
                            onRestoreClick={handleRestoreClick}
                            onOpenPermModal={openPermModal}
                            getRoleBadgeColor={getRoleBadgeColor}
                            getRoleLabel={getRoleLabel}
                        />
                        <UserPagination
                            loading={loading}
                            totalCount={filteredAndSortedUsers.length}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </section>

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
