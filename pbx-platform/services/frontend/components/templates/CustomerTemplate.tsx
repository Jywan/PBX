"use client";

import { useCustomerData } from "@/hooks/useCustomerData";
import "@/styles/templates/customer.css";
import CustomerGroupList from "@/components/customer/CustomerGroupList";
import CustomerList from "@/components/customer/CustomerList";
import CustomerDetail from "@/components/customer/CustomerDetail";
import CustomerAddModal from "@/components/customer/CustomerAddModal";

export default function CustomerTemplate() {
    const {
        GROUPS, MOCK_CALLS,
        groupCounts, filtered, selectedCustomer, selectedId,
        selectedGroup, search, setSearch,
        editMode, editForm, setEditForm,
        showAddModal, setShowAddModal,
        newForm, setNewForm,
        getGroupLabel, getGroupColor,
        handleSelectGroup, handleSelect,
        handleEditStart, handleEditCancel, handleEditSave,
        handleDelete, handleAddOpen, handleAddSave,
    } = useCustomerData();

    return (
        <div className="customer-container">
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
                calls={MOCK_CALLS}
                setEditForm={setEditForm}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onEditSave={handleEditSave}
                getGroupLabel={getGroupLabel}
                getGroupColor={getGroupColor}
            />
            <CustomerAddModal
                isOpen={showAddModal}
                groups={GROUPS}
                newForm={newForm}
                setNewForm={setNewForm}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddSave}
            />
        </div>
    );
}
