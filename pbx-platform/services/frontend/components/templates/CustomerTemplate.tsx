"use client";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useCustomerData } from "@/hooks/useCustomerData";
import "@/styles/templates/customer.css";
import Toast from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import CustomerGroupList from "@/components/customer/CustomerGroupList";
import CustomerList from "@/components/customer/CustomerList";
import CustomerDetail from "@/components/customer/CustomerDetail";
import CustomerAddModal from "@/components/customer/CustomerAddModal";

export default function CustomerTemplate() {
    const { token, isSystemAdmin, companyId, isLoading } = useAuth();
    const { toast, showToast } = useToast();

    const {
        GROUPS, MOCK_CALLS, companies,
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
    } = useCustomerData({ token, showToast, isSystemAdmin, companyId });

    if (isLoading) {
        return <div style={{ textAlign: "center", padding: "50px" }}>로딩 중...</div>;
    }

    return (
        <div className="customer-container">
            <Toast toast={toast} />
            <ConfirmModal
                isOpen={confirmOpen}
                title="삭제 확인"
                message={confirmMessage}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />
            <CustomerGroupList
                groups={GROUPS}
                groupCounts={groupCounts}
                selectedGroup={selectedGroup}
                onSelectGroup={handleSelectGroup}
            />
            <CustomerList
                filtered={filtered}
                selectedId={selectedId}
                search={search}
                onSearchChange={setSearch}
                onSelect={handleSelect}
                onDelete={handleDelete}
                onAddOpen={handleAddOpen}
                getGroupLabel={getGroupLabel}
                getGroupColor={getGroupColor}
            />
            <CustomerDetail
                selectedCustomer={selectedCustomer}
                editMode={editMode}
                editForm={editForm}
                groups={GROUPS}
                companies={companies}
                calls={MOCK_CALLS}
                setEditForm={setEditForm}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onEditSave={handleEditSave}
                getGroupLabel={getGroupLabel}
                getGroupColor={getGroupColor}
                isSystemAdmin={isSystemAdmin}
            />
            <CustomerAddModal
                isOpen={showAddModal}
                groups={GROUPS}
                companies={companies}
                newForm={newForm}
                setNewForm={setNewForm}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddSave}
                isSystemAdmin={isSystemAdmin}
            />
        </div>
    );
}
