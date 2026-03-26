"use client";

import { useConsultData } from "@/hooks/useConsultData";
import "@/styles/templates/consult.css";
import ConsultWaitingList from "@/components/consult/ConsultWaitingList";
import ConsultWork from "@/components/consult/ConsultWork";
import ConsultCustomerInfo from "@/components/consult/ConsultCustomerInfo";

export default function ConsultTemplate() {
    const {
        waitingCalls, selectedCall, selectedCallId,
        activeTab, setActiveTab,
        memo, setMemo,
        callTimer,
        customer,
        categories,
        consultCategoryId, setConsultCategoryId,
        consultSaving,
        handleSelectCall, handleEndCall, handleSaveConsult, handleCreateCustomer,
    } = useConsultData();

    return (
        <div className="consult-container">
            <ConsultWaitingList
                waitingCalls={waitingCalls}
                selectedCallId={selectedCallId}
                onSelect={handleSelectCall}
            />
            <ConsultWork
                selectedCall={selectedCall}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                memo={memo}
                setMemo={setMemo}
                callTimer={callTimer}
                onEndCall={handleEndCall}
                categories={categories}
                consultCategoryId={consultCategoryId}
                onCategoryChange={setConsultCategoryId}
                onSaveConsult={handleSaveConsult}
                consultSaving={consultSaving}
            />
            <ConsultCustomerInfo
                selectedCall={selectedCall}
                customer={customer}
                onCreateCustomer={handleCreateCustomer}
            />
        </div>
    );
}
