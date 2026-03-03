"use client";

import type { ActionItem } from "@/hooks/usePermissionData";

interface PermissionDrawerProps {
    isOpen: boolean;
    isEditMode: boolean;
    menuName: string;
    menuCode: string;
    actions: ActionItem[];
    onClose: () => void;
    onSave: () => void;
    onMenuNameChange: (v: string) => void;
    onMenuCodeChange: (v: string) => void;
    onAddAction: () => void;
    onRemoveAction: (idx: number) => void;
    onUpdateAction: (idx: number, field: string, value: any) => void;
}

export default function PermissionDrawer({
    isOpen, isEditMode, menuName, menuCode, actions,
    onClose, onSave,
    onMenuNameChange, onMenuCodeChange,
    onAddAction, onRemoveAction, onUpdateAction,
}: PermissionDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="drawer-content">
                <div className="drawer-header">
                    <h3>{isEditMode ? `[${menuName}] 규격 수정` : "신규 권한 규격 정의"}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                </div>
                <div className="drawer-body">
                    <div className="form-section">
                        <label className="form-label">메뉴 기본 정보</label>
                        <div className="flex-gap-10">
                            <input className="form-input" placeholder="메뉴명" value={menuName} onChange={e => onMenuNameChange(e.target.value)} />
                            <input className="form-input" placeholder="코드" value={menuCode} onChange={e => onMenuCodeChange(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-section">
                        <div className="flex-between mb-16">
                            <label className="form-label">하위 액션 선언 및 활성화 설정</label>
                            <button className="btn-text-blue" onClick={onAddAction}>+ 액션 추가</button>
                        </div>
                        {actions.map((action, idx) => (
                            <div key={idx} className="action-row">
                                <label className="switch">
                                    <input type="checkbox" checked={action.is_active} onChange={e => onUpdateAction(idx, 'is_active', e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                                <input className="form-input flex-1" placeholder="액션명" value={action.name} onChange={e => onUpdateAction(idx, 'name', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                <input className="form-input flex-1" placeholder="코드" value={action.code} onChange={e => onUpdateAction(idx, 'code', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                <button className="btn-remove" onClick={() => onRemoveAction(idx)}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="drawer-footer">
                    <button className="btn-ghost" onClick={onClose}>취소</button>
                    <button className="btn-primary flex-2" onClick={onSave}>DB 반영하기</button>
                </div>
            </div>
        </>
    );
}
