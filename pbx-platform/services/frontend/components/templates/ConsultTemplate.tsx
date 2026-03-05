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
        handleSelectCall, handleEndCall,
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
            />
            <ConsultCustomerInfo
                selectedCall={selectedCall}
                customer={customer}
            />
        </div>
    );
}
