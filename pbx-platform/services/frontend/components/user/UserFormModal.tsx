"use client";

import { useState, useEffect, useRef } from "react";
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
    extensionError?: string | null;
    onClose: () => void;
    onSave: () => void;
    onFormChange: (data: UserFormState) => void;
}

function validateExtension(value: string): string | null {
    if (value && !/^[0-9\-]+$/.test(value)) return "숫자와 하이픈(-)만 입력 가능합니다.";
    return null;
}

function validatePassword(password: string): string | null {
    if (password.length < 8) return "비밀번호는 최소 8자 이상이어야 합니다.";
    if (!/[a-zA-Z]/.test(password)) return "영문자를 1개 이상 포함해야 합니다.";
    if (!/[0-9]/.test(password)) return "숫자를 1개 이상 포함해야 합니다.";
    return null;
}

const KOREAN_REGEX = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;

export default function UserFormModal({
    isOpen, isEditMode, formData, companies, saving,
    canCreateUser, canUpdateUser, extensionError, onClose, onSave, onFormChange,
}: Props) {
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [extensionFormatError, setExtensionFormatError] = useState<string | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [isCapsLock, setIsCapsLock] = useState(false);
    const isComposingRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setPasswordError(null);
            setConfirmPassword("");
            setConfirmError(null);
            setIsCapsLock(false);
            setExtensionFormatError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const canEdit = isEditMode ? canUpdateUser : canCreateUser;

    const handleSaveClick = () => {
        if (passwordError) return;
        if (extensionFormatError) return;
        if (formData.password && formData.password !== confirmPassword) {
            setConfirmError("비밀번호가 일치하지 않습니다.");
            return;
        }
        setConfirmError(null);
        onSave();
    };

    const handleExtensionChange = (value: string) => {
        setExtensionFormatError(validateExtension(value));
        onFormChange({ ...formData, extension: value });
    };

    const handlePasswordChange = (value: string) => {
        if (isComposingRef.current) return;
        const filtered = value.replace(KOREAN_REGEX, "");
        setPasswordError(filtered ? validatePassword(filtered) : null);
        setConfirmPassword("");
        setConfirmError(null);
        onFormChange({ ...formData, password: filtered });
    };

    const handleConfirmChange = (value: string) => {
        if (isComposingRef.current) return;
        const filtered = value.replace(KOREAN_REGEX, "");
        if (confirmError) setConfirmError(null);
        setConfirmPassword(filtered);
    };

    const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLock(e.getModifierState("CapsLock"));
    };

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
                    {/* 소속 업체 — 전체 너비 */}
                    <div className="user-form-group user-form-group--full">
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

                    {/* 계정 ID | 이름 */}
                    <div className="user-form-group">
                        <label className="user-form-label">
                            계정 ID <span className="user-form-label-required">*</span>
                        </label>
                        <input
                            value={formData.username}
                            onChange={e => onFormChange({ ...formData, username: e.target.value })}
                            placeholder="로그인 아이디"
                            disabled={!canEdit}
                            className="user-form-input"
                        />
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

                    {/* 비밀번호 | 비밀번호 재확인 (재확인 없을 땐 전체 너비) */}
                    <div className="user-form-group">
                        <label className="user-form-label">
                            비밀번호 {isEditMode ? '(변경 시에만 입력)' : <span className="user-form-label-required">*</span>}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => handlePasswordChange(e.target.value)}
                            onCompositionStart={() => { isComposingRef.current = true; }}
                            onCompositionEnd={e => { isComposingRef.current = false; handlePasswordChange(e.currentTarget.value); }}
                            onKeyDown={handleKeyEvent}
                            onKeyUp={handleKeyEvent}
                            placeholder="비밀번호 입력"
                            disabled={!canEdit}
                            className={`user-form-input${passwordError ? " user-form-input--error" : ""}`}
                        />
                        {passwordError ? (
                            <p className="user-form-error-text">{passwordError}</p>
                        ) : isCapsLock ? (
                            <p className="user-form-caps-warning">⚠ Caps Lock 켜짐</p>
                        ) : (
                            <p className="user-form-helper-text">8자 이상, 영문+숫자 포함</p>
                        )}
                    </div>
                    <div className="user-form-group">
                        <label className="user-form-label">
                            비밀번호 재확인 <span className="user-form-label-required">*</span>
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => handleConfirmChange(e.target.value)}
                            onCompositionStart={() => { isComposingRef.current = true; }}
                            onCompositionEnd={e => { isComposingRef.current = false; handleConfirmChange(e.currentTarget.value); }}
                            onKeyDown={handleKeyEvent}
                            onKeyUp={handleKeyEvent}
                            placeholder="비밀번호 재입력"
                            disabled={!canEdit}
                            className={`user-form-input${confirmError ? " user-form-input--error" : ""}`}
                        />
                        {confirmError ? (
                            <p className="user-form-error-text">{confirmError}</p>
                        ) : confirmPassword && formData.password === confirmPassword ? (
                            <p className="user-form-confirm-ok">일치합니다.</p>
                        ) : null}
                    </div>

                    {/* 내선 번호 | 권한(Role) */}
                    <div className="user-form-group">
                        <label className="user-form-label">내선 번호</label>
                        <input
                            value={formData.extension}
                            onChange={e => handleExtensionChange(e.target.value)}
                            placeholder="예: 201"
                            disabled={!canEdit}
                            className={`user-form-input${(extensionFormatError || extensionError) ? " user-form-input--error" : ""}`}
                        />
                        {extensionFormatError ? (
                            <p className="user-form-error-text">{extensionFormatError}</p>
                        ) : extensionError ? (
                            <p className="user-form-error-text">{extensionError}</p>
                        ) : null}
                    </div>
                    <div className="user-form-group">
                        <label className="user-form-label">권한(Role)</label>
                        <select
                            value={formData.role}
                            onChange={e => onFormChange({ ...formData, role: e.target.value })}
                            disabled={!canEdit || formData.role === 'SYSTEM_ADMIN'}
                            className="user-form-input"
                        >
                            <option value="AGENT">상담원</option>
                            <option value="MANAGER">관리자</option>
                            {formData.role === 'SYSTEM_ADMIN' && (
                                <option value="SYSTEM_ADMIN">시스템 관리자</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="user-modal-footer">
                    <button onClick={onClose} disabled={saving} className="user-modal-cancel-btn">취소</button>
                    {canEdit && (
                        <button onClick={handleSaveClick} disabled={saving} className="user-modal-save-btn">
                            {saving ? '저장 중...' : (isEditMode ? '✓ 수정 완료' : '✓ 상담원 등록')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
