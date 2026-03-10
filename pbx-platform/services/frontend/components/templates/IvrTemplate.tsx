"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useIvrData } from "@/hooks/useIvrData";
import { fetchCompanies } from "@/lib/api/companies";
import Toast from "@/components/common/Toast";
import IvrFlowList from "@/components/ivr/IvrFlowList";
import IvrTreeCanvas from "@/components/ivr/IvrTreeCanvas";
import IvrNodeEditor from "@/components/ivr/IvrNodeEditor";
import type { IvrNode, IvrNodeCreate, IvrNodeUpdate } from "@/types/ivr";
import type { Company } from "@/types/company";
import "@/styles/templates/ivr.css";

type EditorMode =
    | { mode: "add"; flowId: number; parentNode: IvrNode | null }
    | { mode: "edit"; node: IvrNode };

export default function IvrTemplate() {
    const { token, isSystemAdmin, companyId, isLoading } = useAuth();
    const { toast, showToast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        if (!token || !isSystemAdmin) return;
        fetchCompanies(token).then(setCompanies).catch(() => {});
    }, [token, isSystemAdmin]);

    const {
        flows, selectedFlow, selectedNode,
        setSelectedNode,
        handleSelectFlow,
        handleCreateFlow,
        handleUpdateFlow,
        handleDeleteFlow,
        handleCloneFlow,
        handleCreateNode,
        handleUpdateNode,
        handleDeleteNode,
    } = useIvrData(showToast);

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
        await handleCreateNode(data);
        setEditorMode(null);
    };

    const handleSaveEdit = async (nodeId: number, data: IvrNodeUpdate) => {
        await handleUpdateNode(nodeId, data);
        setEditorMode(null);
    };

    const handleDeleteNodeAndClose = async (nodeId: number) => {
        await handleDeleteNode(nodeId);
        setEditorMode(null);
    };

    if (isLoading) return <div style={{ textAlign: "center", padding: "50px" }}>로딩 중...</div>;

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
        />

        <IvrTreeCanvas
            flow={selectedFlow}
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={handleNodeSelect}
            onAddChildNode={handleAddChildNode}
            onAddRootNode={handleAddRootNode}
        />

        <IvrNodeEditor
            editorMode={editorMode}
            onSaveAdd={handleSaveAdd}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDeleteNodeAndClose}
            onClose={() => setEditorMode(null)}
        />
        </div>
    );
}
