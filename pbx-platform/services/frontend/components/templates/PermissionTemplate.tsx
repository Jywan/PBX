"use client";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { usePermissionData } from "@/hooks/usePermissionData";

import "@/styles/templates/permissionTemplate.css";
import Toast from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import PermissionHeader from "@/components/permission/PermissionHeader";
import PermissionTable from "@/components/permission/PermissionTable";
import PermissionDrawer from "@/components/permission/PermissionDrawer";

export default function PermissionTemplate() {
    const { token, isLoading: authLoading } = useAuth();
    const { toast, showToast } = useToast();

    const {
        templates, loading,
        isDrawerOpen, setIsDrawerOpen,
        isEditMode,
        menuName, setMenuName,
        menuCode, setMenuCode,
        actions,
        confirmOpen, confirmMessage, onConfirm, closeConfirm,
        handleReactivateClick, handleDeleteClick, handleSave,
        openDrawer, addAction, removeAction, updateAction,
    } = usePermissionData({ token, authLoading, showToast });

    return (
        <div className="perm-container">
            <Toast toast={toast} />
            <ConfirmModal
                isOpen={confirmOpen}
                message={confirmMessage}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />
            <PermissionHeader onOpenDrawer={() => openDrawer()} />
            <PermissionTable
                loading={loading}
                templates={templates}
                onEdit={openDrawer}
                onDelete={handleDeleteClick}
                onReactivate={handleReactivateClick}
            />
            <PermissionDrawer
                isOpen={isDrawerOpen}
                isEditMode={isEditMode}
                menuName={menuName}
                menuCode={menuCode}
                actions={actions}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSave}
                onMenuNameChange={setMenuName}
                onMenuCodeChange={setMenuCode}
                onAddAction={addAction}
                onRemoveAction={removeAction}
                onUpdateAction={updateAction}
            />
        </div>
    );
}
