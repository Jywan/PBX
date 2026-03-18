"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useQueueData } from "@/hooks/useQueueData";
import { fetchCompanies } from "@/lib/api/companies";
import { hasPermission } from "@/lib/auth";
import Toast from "@/components/common/Toast";
import QueueList from "@/components/queue/QueueList";
import QueueEditor from "@/components/queue/QueueEditor";
import QueueMemberList from "@/components/queue/QueueMemberList";
import type { Company } from "@/types/company";
import "@/styles/templates/queue.css";

export default function QueueTemplate() {
    const { token, isSystemAdmin, companyId, isLoading } = useAuth();
    const { toast, showToast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);

    const canView   = isSystemAdmin || hasPermission("queue-detail");
    const canCreate = isSystemAdmin || hasPermission("queue-create");
    const canUpdate = isSystemAdmin || hasPermission("queue-update");
    const canDelete = isSystemAdmin || hasPermission("queue-delete");

    useEffect(() => {
        if (!token || !isSystemAdmin) return;
        fetchCompanies(token).then(setCompanies).catch(() => {});
    }, [token, isSystemAdmin]);

    const {
        queues,
        selectedQueue,
        filterCompanyId,
        setFilterCompanyId,
        handleSelectQueue,
        handleCreateQueue,
        handleUpdateQueue,
        handleDeleteQueue,
        handleAddMember,
        handleRemoveMember,
        handleTogglePause,
    } = useQueueData(showToast);

    if (isLoading) return <div style={{ textAlign: "center", padding: "50px" }}>로딩 중...</div>;
    if (!canView) return <div style={{ textAlign: "center", padding: "50px" }}>큐관리 페이지에 대한 접근 권한이 없습니다.</div>;

    return (
        <div className="queue-container">
            <Toast toast={toast} />

            <QueueList
                queues={queues}
                selectedQueue={selectedQueue}
                onSelect={handleSelectQueue}
                onCreate={handleCreateQueue}
                onDelete={handleDeleteQueue}
                onToggleActive={(queueId, isActive) => handleUpdateQueue(queueId, { is_active: isActive })}
                companyId={companyId}
                isSystemAdmin={isSystemAdmin}
                companies={companies}
                filterCompanyId={filterCompanyId}
                onFilterCompanyChange={setFilterCompanyId}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
            />

            {selectedQueue ? (
                <div className="queue-detail-wrap">
                    <QueueEditor
                        queue={selectedQueue}
                        onSave={handleUpdateQueue}
                        canUpdate={canUpdate}
                    />
                    <QueueMemberList
                        queue={selectedQueue}
                        token={token!}
                        onAdd={handleAddMember}
                        onRemove={handleRemoveMember}
                        onTogglePause={handleTogglePause}
                        canUpdate={canUpdate}
                    />
                </div>
            ) : (
                <div className="queue-detail-empty">
                    <span>큐를 선택하세요</span>
                </div>
            )}
        </div>
    );
}
