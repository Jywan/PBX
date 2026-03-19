"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useIvrData } from "@/hooks/useIvrData";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchQueues } from "@/lib/api/queue";
import { fetchUsers } from "@/lib/api/users";
import { hasPermission } from "@/lib/auth";
import Toast from "@/components/common/Toast";
import IvrFlowList from "@/components/ivr/IvrFlowList";
import IvrTreeCanvas from "@/components/ivr/IvrTreeCanvas";
import IvrNodeEditor from "@/components/ivr/IvrNodeEditor";
import type { IvrNode, IvrNodeCreate, IvrNodeUpdate } from "@/types/ivr";
import type { Company } from "@/types/company";
import type { Queue } from "@/types/queue";
import type { User } from "@/types/user";

import "@/styles/templates/ivr.css";

type EditorMode =
    | { mode: "add"; flowId: number; parentNode: IvrNode | null }
    | { mode: "edit"; node: IvrNode };

export default function IvrTemplate() {
    const { token, isSystemAdmin, companyId, isLoading } = useAuth();
    const { toast, showToast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [queues, setQueues] = useState<Queue[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const canView   = isSystemAdmin || hasPermission("ivr-detail");
    const canCreate = isSystemAdmin || hasPermission("ivr-create");
    const canUpdate = isSystemAdmin || hasPermission("ivr-update");
    const canDelete = isSystemAdmin || hasPermission("ivr-delete");

    useEffect(() => {
        if (!token || !isSystemAdmin) return;
        fetchCompanies(token).then(setCompanies).catch(() => {});
    }, [token, isSystemAdmin]);

    const {
        flows, selectedFlow, selectedNode,
        filterCompanyId, setFilterCompanyId,
        setSelectedNode,
        handleSelectFlow,
        handleCreateFlow,
        handleUpdateFlow,
        handleDeleteFlow,
        handleCloneFlow,
        handleCreateNode,
        handleUpdateNode,
        handleDeleteNode,
        handleUploadNodeSound,
        handleDeleteNodeSound,
    } = useIvrData(showToast);

    useEffect(() => {
        if (!token) return;
        const cid = isSystemAdmin
            ? (selectedFlow?.company_id ?? filterCompanyId ?? undefined)
            : companyId ?? undefined;
        fetchQueues(token, cid !== undefined ? { company_id: cid } : undefined)
            .then(setQueues)
            .catch(() => {});
    }, [token, isSystemAdmin, companyId, selectedFlow, filterCompanyId]);

    useEffect(() => {
        if (!token) return;
        const cid = isSystemAdmin
            ? (selectedFlow?.company_id ?? undefined)
            : companyId ?? undefined;
        if (cid === undefined) return;
        fetchUsers(token, cid).then(setUsers).catch(() => {});
    }, [token, isSystemAdmin, companyId, selectedFlow]);

    const [editorMode, setEditorMode] = useState<EditorMode | null>(null);

    const handleNodeSelect = (node: IvrNode) => {
        setSelectedNode(node);
        setEditorMode({ mode: "edit", node });
    };

    const handleAddChildNode = (parentNode: IvrNode) => {
        if (!selectedFlow) return;
        setEditorMode({ mode: "add", flowId: selectedFlow.id, parentNode });
    };

    const handleAddRootNode = () => {
        if (!selectedFlow) return;
        setEditorMode({ mode: "add", flowId: selectedFlow.id, parentNode: null });
    };

    const handleSaveAdd = async (data: IvrNodeCreate) => {
        const newNode = await handleCreateNode(data);
        if (newNode) {
            setEditorMode({ mode: "edit", node: newNode });
        } else {
            setEditorMode(null);
        }
    };

    const handleSaveEdit = async (nodeId: number, data: IvrNodeUpdate) => {
        await handleUpdateNode(nodeId, data);
        setEditorMode(null);
    };

    const handleDeleteNodeAndClose = async (nodeId: number) => {
        await handleDeleteNode(nodeId);
        setEditorMode(null);
    };

    const handleReparentNode = async (nodeId: number, newParentId: number | null) => {
        await handleUpdateNode(nodeId, { parent_id: newParentId });
    };

    const handleUploadSound = async (nodeId: number, formData: FormData) => {
        const refreshedNode = await handleUploadNodeSound(nodeId, formData);
        if (refreshedNode) setEditorMode({ mode: "edit", node: refreshedNode });
    };

    const handleDeleteSound = async (nodeId: number) => {
        const refreshedNode = await handleDeleteNodeSound(nodeId);
        if (refreshedNode) setEditorMode({ mode: "edit", node: refreshedNode });
    };

    if (isLoading) return <div style={{ textAlign: "center", padding: "50px" }}>로딩 중...</div>;
    if (!canView) return <div style={{ textAlign: "center", padding: "50px" }}>IVR 페이지에 대한 접근 권한이 없습니다.</div>;

    return (
        <div className="ivr-container">
            <Toast toast={toast} />

            <IvrFlowList
                flows={flows}
                selectedFlow={selectedFlow}
                onSelect={handleSelectFlow}
                onCreate={handleCreateFlow}
                onDelete={handleDeleteFlow}
                onClone={handleCloneFlow}
                onToggleActive={(flowId, isActive) => handleUpdateFlow(flowId, { is_active: isActive })}
                companyId={companyId}
                isSystemAdmin={isSystemAdmin}
                companies={companies}
                filterCompanyId={filterCompanyId}
                onFilterCompanyChange={setFilterCompanyId}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
            />

            <IvrTreeCanvas
                flow={selectedFlow}
                selectedNodeId={selectedNode?.id ?? null}
                onSelectNode={handleNodeSelect}
                onAddChildNode={handleAddChildNode}
                onAddRootNode={handleAddRootNode}
                onReparentNode={handleReparentNode}
                canUpdate={canUpdate}
            />

            <IvrNodeEditor
                editorMode={editorMode}
                queues={queues}
                onSaveAdd={handleSaveAdd}
                onSaveEdit={handleSaveEdit}
                onDelete={handleDeleteNodeAndClose}
                onClose={() => setEditorMode(null)}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onUploadSound={handleUploadSound}
                onDeleteSound={handleDeleteSound}
                users={users}
            />
        </div>
    );
}
