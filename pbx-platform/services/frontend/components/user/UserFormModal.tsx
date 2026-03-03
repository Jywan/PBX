"use client";

import type { UserFormState } from "@/types/user";
import type { Company } from "@/types/company";

interface Props {
    isOpen: boolean;
    isEditMode: boolean;
    formData: UserFormState;
    companies: Company[];
    saving: boolean;
    canCreateUser: boolean;
    canUpdateUser: boolean;
    onClose: () => void;
    onSave: () => void;
    onFormChange: (data: UserFormState) => void;
}

export default function UserFormModal({
    isOpen, isEditMode, formData, companies, saving,
    canCreateUser, canUpdateUser, onClose, onSave, onFormChange,
}: Props) {
    if (!isOpen) return null;

    const canEdit = isEditMode ? canUpdateUser : canCreateUser;

    return (
        <div className="user-modal-overlay">
            <div className="user-modal-content">
                <div className="user-modal-header">
                    <h3 className="user-modal-title">
                        {isEditMode ? '✏️ 상담원 정보 수정' : '➕ 신규 상담원 등록'}
                    </h3>
                    <button onClick={onClose} className="user-modal-close-btn">✕</button>
                </div>

                <div className="user-modal-body">
                    <div className="user-form-group">
                        <label className="user-form-label">
                            소속 업체 <span className="user-form-label-required">*</span>
                        </label>
                        <select
                            value={formData.company_id || ""}
                            onChange={e => onFormChange({ ...formData, company_id: e.target.value ? Number(e.target.value) : "" })}
                            disabled={isEditMode || !canEdit}
                            className="user-form-input"
                        >
                            <option value="">선택하세요</option>
                            {companies.map(comp => (
                                <option key={comp.id} value={comp.id}>{comp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="user-form-group">
                        <label className="user-form-label">
                            계정 ID <span className="user-form-label-required">*</span>
                        </label>
                        <input
                            value={formData.username}
                            onChange={e => onFormChange({ ...formData, username: e.target.value })}
                            placeholder="로그인 아이디 (영문/숫자)"
                            disabled={!canEdit}
                            className="user-form-input"
                        />
                    </div>

                    <div className="user-form-group">
                        <label className="user-form-label">
                            비밀번호 {isEditMode ? '(변경 시에만 입력)' : <span className="user-form-label-required">*</span>}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => onFormChange({ ...formData, password: e.target.value })}
                            placeholder="비밀번호 입력"
                            disabled={!canEdit}
                            className="user-form-input"
                        />
                        <p className="user-form-helper-text">최소 8자 이상, 영문자 1개 이상, 숫자 1개 이상 포함</p>
                    </div>

                    <div className="user-form-group">
                        <label className="user-form-label">
                            이름 <span className="user-form-label-required">*</span>
                        </label>
                        <input
                            value={formData.name}
                            onChange={e => onFormChange({ ...formData, name: e.target.value })}
                            placeholder="상담원 실명"
                            disabled={!canEdit}
                            className="user-form-input"
                        />
                    </div>

                    <div className="user-form-group">
                        <label className="user-form-label">내선 번호</label>
                        <input
                            value={formData.extension}
                            onChange={e => onFormChange({ ...formData, extension: e.target.value })}
                            placeholder="예: 201"
                            disabled={!canEdit}
                            className="user-form-input"
                        />
                    </div>

                    <div className="user-form-group">
                        <label className="user-form-label">권한(Role)</label>
                        <select
                            value={formData.role}
                            onChange={e => onFormChange({ ...formData, role: e.target.value })}
                            disabled={!canEdit}
                            className="user-form-input"
                        >
                            <option value="AGENT">상담원 (AGENT)</option>
                            <option value="MANAGER">매니저 (MANAGER)</option>
                            <option value="SYSTEM_ADMIN">시스템 관리자 (ADMIN)</option>
                        </select>
                    </div>
                </div>

                <div className="user-modal-footer">
                    <button onClick={onClose} disabled={saving} className="user-modal-cancel-btn">취소</button>
                    {canEdit && (
                        <button onClick={onSave} disabled={saving} className="user-modal-save-btn">
                            {saving ? '저장 중...' : (isEditMode ? '✓ 수정 완료' : '✓ 상담원 등록')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
