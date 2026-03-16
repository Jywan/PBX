"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchFlows, fetchFlow, createFlow, updateFlow, deleteFlow, cloneFlow,
    createNode, updateNode, deleteNode, uploadNodeSound, deleteNodeSound,
} from "@/lib/api/ivr";
import type { IvrFlow, IvrNode, IvrFlowCreate, IvrFlowUpdate, IvrNodeCreate, IvrNodeUpdate } from "@/types/ivr";

export function useIvrData(showToast: (msg: string, type: "success" | "error") => void) {
    const { token, companyId, isSystemAdmin } = useAuth();

    const [flows, setFlows] = useState<IvrFlow[]>([]);
    const [selectedFlow, setSelectedFlow] = useState<IvrFlow | null>(null);
    const [selectedNode, setSelectedNode] = useState<IvrNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);

    const loadFlows = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchFlows(token, {
                company_id: isSystemAdmin ? (filterCompanyId ?? undefined) : companyId ?? undefined,
                include_presets: true,
            });
            setFlows(data);
        } catch {
            showToast("IVR 목록 로드 실패", "error");
        } finally {
            setLoading(false);
        }
    }, [token, companyId, isSystemAdmin, filterCompanyId, showToast]);

    useEffect(() => {
        loadFlows();
    }, [loadFlows]);

    const handleSelectFlow = useCallback(async (flow: IvrFlow) => {
        if (!token) return;
        try {
            const detail = await fetchFlow(token, flow.id);
            setSelectedFlow(detail);
            setSelectedNode(null);
        } catch {
            showToast("IVR 플로우 로드 실패", "error");
        }
    }, [token, showToast]);

    const handleCreateFlow = useCallback(async (data: IvrFlowCreate) => {
        if (!token) return;
        try {
            const created = await createFlow(token, data);
            await loadFlows();
            await handleSelectFlow(created);
            showToast("IVR 플로우가 생성되었습니다.", "success");
        } catch {
            showToast("IVR 플로우 생성 실패", "error");
        }
    }, [token, loadFlows, handleSelectFlow, showToast]);

    const handleUpdateFlow = useCallback(async (flowId: number, data: IvrFlowUpdate) => {
        if (!token) return;
        try {
            await updateFlow(token, flowId, data);
            await loadFlows();
            if (selectedFlow?.id === flowId) {
                const updated = await fetchFlow(token, flowId);
                setSelectedFlow(updated);
            }
            showToast("수정되었습니다.", "success");
        } catch {
            showToast("수정 실패", "error");
        }
    }, [token, selectedFlow, loadFlows, showToast]);

    const handleDeleteFlow = useCallback(async (flowId: number) => {
        if (!token) return;
        try {
            await deleteFlow(token, flowId);
            if (selectedFlow?.id === flowId) {
                setSelectedFlow(null);
                setSelectedNode(null);
            }
            await loadFlows();
            showToast("삭제되었습니다.", "success");
        } catch {
            showToast("삭제 실패", "error");
        }
    }, [token, selectedFlow, loadFlows, showToast]);

    const handleCloneFlow = useCallback(async (flowId: number, name: string) => {
        if (!token) return;
        try {
            const cloned = await cloneFlow(token, flowId, {
                name,
                company_id: isSystemAdmin ? null : companyId,
            });
            await loadFlows();
            await handleSelectFlow(cloned);
            showToast("프리셋을 복제했습니다.", "success");
        } catch {
            showToast("복제 실패", "error");
        }
    }, [token, companyId, isSystemAdmin, loadFlows, handleSelectFlow, showToast]);

    const handleCreateNode = useCallback(async (data: IvrNodeCreate): Promise<IvrNode | null> => {
        if (!token || !selectedFlow) return null;
        try {
            const created = await createNode(token, selectedFlow.id, data);
            const updated = await fetchFlow(token, selectedFlow.id);
            setSelectedFlow(updated);
            showToast("노드가 추가되었습니다.", "success");
            return created;
        } catch {
            showToast("노드 추가 실패", "error");
            return null;
        }
    }, [token, selectedFlow, showToast]);

    const handleUpdateNode = useCallback(async (nodeId: number, data: IvrNodeUpdate) => {
        if (!token || !selectedFlow) return;
        try {
            await updateNode(token, nodeId, data);
            const updated = await fetchFlow(token, selectedFlow.id);
            setSelectedFlow(updated);
            const refreshedNode = updated.nodes.find(n => n.id === nodeId) ?? null;
            setSelectedNode(refreshedNode);
            showToast("노드가 수정되었습니다.", "success");
        } catch {
            showToast("노드 수정 실패", "error");
        }
    }, [token, selectedFlow, showToast]);

    const handleDeleteNode = useCallback(async (nodeId: number) => {
        if (!token || !selectedFlow) return;
        try {
            await deleteNode(token, nodeId);
            if (selectedNode?.id === nodeId) setSelectedNode(null);
            const updated = await fetchFlow(token, selectedFlow.id);
            setSelectedFlow(updated);
            showToast("노드가 삭제되었습니다.", "success");
        } catch {
            showToast("노드 삭제 실패", "error");
        }
    }, [token, selectedFlow, selectedNode, showToast]);

    const handleUploadNodeSound = useCallback(async (nodeId: number, formData: FormData): Promise<IvrNode | null> => {
        if (!token || !selectedFlow) return null;
        try {
            await uploadNodeSound(token, nodeId, formData);
            const updated = await fetchFlow(token, selectedFlow.id);
            setSelectedFlow(updated);
            const refreshedNode = updated.nodes.find(n => n.id === nodeId) ?? null;
            setSelectedNode(refreshedNode);
            showToast("음성파일이 업로드되었습니다.", "success");
            return refreshedNode;
        } catch {
            showToast("음성파일 업로드 실패", "error");
            return null;
        }
    }, [token, selectedFlow, showToast]);

    const handleDeleteNodeSound = useCallback(async (nodeId: number): Promise<IvrNode | null> => {
        if (!token || !selectedFlow) return null;
        try {
            await deleteNodeSound(token, nodeId);
            const updated = await fetchFlow(token, selectedFlow.id);
            setSelectedFlow(updated);
            const refreshedNode = updated.nodes.find(n => n.id === nodeId) ?? null;
            setSelectedNode(refreshedNode);
            showToast("음성파일이 삭제되었습니다.", "success");
            return refreshedNode;
        } catch {
            showToast("음성파일 삭제 실패", "error");
            return null;
        }
    }, [token, selectedFlow, showToast]);

    return {
        flows,
        selectedFlow,
        selectedNode,
        loading,
        filterCompanyId,
        setFilterCompanyId,
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
    };
}
