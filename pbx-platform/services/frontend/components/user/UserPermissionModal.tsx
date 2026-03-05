"use client";

import "@/styles/templates/userPermission.css";
import type { User } from "@/types/user";

interface Props {
    isOpen: boolean;
    targetUser: User | null;
    permTemplates: any[];
    permChecked: Set<number>;
    permLoading: boolean;
    permSaving: boolean;
    canUpsertPermission: boolean;
    onClose: () => void;
    onSave: () => void;
    onMenuToggle: (menuId: number) => void;
    onPermToggle: (permId: number) => void;
}

export default function UserPermissionModal({
    isOpen, targetUser, permTemplates, permChecked,
    permLoading, permSaving, canUpsertPermission,
    onClose, onSave, onMenuToggle, onPermToggle,
}: Props) {
    if (!isOpen) return null;

    return (
        <div className="perm-modal-overlay">
            <div className="perm-modal-content">
                <div className="perm-modal-header">
                    <h3 className="perm-modal-title">🔑 '{targetUser?.name}' 권한 설정</h3>
                    <button onClick={onClose} className="perm-modal-close-btn">✕</button>
                </div>

                <div className="perm-modal-body">
                    {permLoading ? (
                        <div className="user-perm-loading">권한 정보 로딩 중...</div>
                    ) : permTemplates.filter(m => m.is_active).length === 0 ? (
                        <div className="user-perm-empty">등록된 권한 템플릿이 없습니다.</div>
                    ) : (
                        <div className="user-perm-list">
                            {permTemplates.filter(menu => menu.is_active).map(menu => (
                                <div key={menu.id} className="user-perm-menu-group">
                                    <div className="user-perm-menu-header">
                                        <label className="user-perm-menu-toggle">
                                            <input
                                                type="checkbox"
                                                checked={permChecked.has(menu.id)}
                                                onChange={() => onMenuToggle(menu.id)}
                                                disabled={!canUpsertPermission}
                                                className="user-perm-checkbox"
                                            />
                                            <span className="user-perm-menu-name">{menu.name}</span>
                                        </label>
                                        <span className="user-perm-menu-code">{menu.code}</span>
                                    </div>
                                    <div className="user-perm-actions">
                                        {(menu.children || []).filter((a: any) => a.is_active).map((action: any) => (
                                            <label key={action.id} className="user-perm-action-item">
                                                <input
                                                    type="checkbox"
                                                    checked={permChecked.has(action.id)}
                                                    onChange={() => onPermToggle(action.id)}
                                                    className="user-perm-checkbox"
                                                    disabled={!canUpsertPermission || !permChecked.has(menu.id)}
                                                />
                                                <span className={`user-perm-action-name ${!permChecked.has(menu.id) ? 'disabled' : ''}`}>
                                                    {action.name}
                                                </span>
                                                <span className="user-perm-action-code">{action.code}</span>
                                            </label>
                                        ))}
                                        {(menu.children || []).filter((a: any) => a.is_active).length === 0 && (
                                            <p className="user-perm-no-actions">등록된 액션이 없습니다.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="perm-modal-footer">
                    <button onClick={onClose} disabled={permSaving} className="perm-modal-cancel-btn">취소</button>
                    {canUpsertPermission && (
                        <button onClick={onSave} disabled={permSaving || permLoading} className="perm-modal-save-btn">
                            {permSaving ? '저장 중...' : '✓ 권한 저장'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
