"use client";

import { useState } from "react";
import type { IvrFlow, IvrFlowCreate } from "@/types/ivr";
import type { Company } from "@/types/company";

interface Props {
    flows: IvrFlow[];
    selectedFlow: IvrFlow | null;
    onSelect: (flow: IvrFlow) => void;
    onCreate: (data: IvrFlowCreate) => void;
    onDelete: (flowId: number) => void;
    onClone: (flowId: number, name: string) => void;
    onToggleActive: (flowId: number, isActive: boolean) => void;
    companyId: number | null;
    isSystemAdmin: boolean;
    companies: Company[];
    filterCompanyId: number | null;
    onFilterCompanyChange: (id: number | null) => void;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export default function IvrFlowList({
    flows, selectedFlow, onSelect, onCreate, onDelete, onClone, onToggleActive,
    companyId, isSystemAdmin, companies, filterCompanyId, onFilterCompanyChange,
    canCreate, canUpdate, canDelete,
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [cloneFlowId, setCloneFlowId] = useState<number | null>(null);
    const [cloneName, setCloneName] = useState("");

    const presets = flows.filter(f => f.is_preset);
    const myFlows = flows.filter(f => !f.is_preset);

    const handleCreate = () => {
        if (!newName.trim()) return;
        const targetCompanyId = isSystemAdmin ? filterCompanyId : companyId;
        onCreate({ name: newName.trim(), company_id: targetCompanyId, is_preset: false });
        setNewName("");
        setShowCreate(false);
    };

    const handleClone = (flow: IvrFlow) => {
        setCloneFlowId(flow.id);
        setCloneName(`${flow.name} 복사본`);
    };

    const handleCloneConfirm = () => {
        if (cloneFlowId && cloneName.trim()) {
            onClone(cloneFlowId, cloneName.trim());
            setCloneFlowId(null);
            setCloneName("");
        }
    };

    return (
        <div className="ivr-flow-list">
            <div className="ivr-panel-title">IVR 플로우</div>

            {/* 시스템 관리자 업체 선택 */}
            {isSystemAdmin && (
                <div className="ivr-company-select-wrap">
                    <select
                        className="ivr-company-select"
                        value={filterCompanyId ?? ""}
                        onChange={e => onFilterCompanyChange(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">업체 없음 (글로벌)</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* 내 플로우 */}
            <div className="ivr-flow-section">
                <div className="ivr-section-header">
                    <span className="ivr-section-label">플로우 목록</span>
                    {canCreate && (
                        <button className="btn-ivr-add" onClick={() => setShowCreate(v => !v)} title="새 플로우">+</button>
                    )}
                </div>

                {canCreate && showCreate && (
                    <div className="ivr-create-row">
                        <input
                            className="ivr-name-input"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            placeholder="플로우 이름"
                            autoFocus
                        />
                        <button className="btn-ivr-confirm" onClick={handleCreate}>확인</button>
                        <button className="btn-ivr-cancel" onClick={() => setShowCreate(false)}>취소</button>
                    </div>
                )}

                {myFlows.length === 0 && !showCreate && (
                    <div className="ivr-empty-hint">플로우가 없습니다.</div>
                )}

                {myFlows.map(flow => (
                    <div
                        key={flow.id}
                        className={`ivr-flow-item ${selectedFlow?.id === flow.id ? "active" : ""}`}
                        onClick={() => onSelect(flow)}
                    >
                        <span className={`ivr-active-dot ${flow.is_active ? "on" : "off"}`} />
                        <span className="ivr-flow-name">{flow.name}</span>
                        <div className="ivr-flow-actions" onClick={e => e.stopPropagation()}>
                            {canUpdate && (
                                <button
                                    className="btn-ivr-icon"
                                    title={flow.is_active ? "비활성화" : "활성화"}
                                    onClick={() => onToggleActive(flow.id, !flow.is_active)}
                                >
                                    {flow.is_active ? "⏸" : "▶"}
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    className="btn-ivr-icon btn-danger"
                                    title="삭제"
                                    onClick={() => onDelete(flow.id)}
                                >
                                    🗑
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 프리셋 */}
            {presets.length > 0 && (
                <div className="ivr-flow-section">
                    <div className="ivr-section-header">
                        <span className="ivr-section-label">프리셋</span>
                    </div>
                    {presets.map(flow => (
                        <div
                            key={flow.id}
                            className={`ivr-flow-item preset ${selectedFlow?.id === flow.id ? "active" : ""}`}
                            onClick={() => onSelect(flow)}
                        >
                            <span className="ivr-preset-badge">P</span>
                            <span className="ivr-flow-name">{flow.name}</span>
                            {canCreate && (
                                <div className="ivr-flow-actions" onClick={e => e.stopPropagation()}>
                                    <button
                                        className="btn-ivr-icon"
                                        title="이 프리셋으로 새 플로우 생성"
                                        onClick={() => handleClone(flow)}
                                    >
                                        📋
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 복제 모달 */}
            {cloneFlowId !== null && (
                <div className="ivr-modal-overlay" onClick={() => setCloneFlowId(null)}>
                    <div className="ivr-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="ivr-modal-title">프리셋 복제</div>
                        <input
                            className="ivr-name-input"
                            value={cloneName}
                            onChange={e => setCloneName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCloneConfirm()}
                            placeholder="새 플로우 이름"
                            autoFocus
                        />
                        <div className="ivr-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setCloneFlowId(null)}>취소</button>
                            <button className="btn-modal-save" onClick={handleCloneConfirm}>복제</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
