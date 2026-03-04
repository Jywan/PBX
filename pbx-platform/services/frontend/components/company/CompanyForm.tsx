"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Company, CompanyFormState } from "@/types/company";

interface CompanyFormProps {
    form: CompanyFormState;
    setForm: Dispatch<SetStateAction<CompanyFormState>>;
    companies: Company[],
    selectedId: number | null;
    canCreateCompany: boolean;
    canUpdateCompany: boolean;
    canDeleteCompany: boolean;
    onSave: () => void;
    onDelete: () => void;
    onRestore: () => void;
    onContactChange: (v: string) => void;
    onBusinessNumberChange: (v: string) => void;
    onFaxChange: (v: string) => void;
}

export default function CompanyForm({
    form, setForm, companies, selectedId,
    canCreateCompany, canDeleteCompany, canUpdateCompany,
    onSave, onDelete, onRestore,
    onContactChange, onBusinessNumberChange, onFaxChange,
}: CompanyFormProps) {
    const isDisabled = form.id ? !canUpdateCompany : !canCreateCompany;

    return (
        <section className="company-col company-col-base">
            <h3 className="company-title">업체 기본 정보</h3>

            {!selectedId && companies.length === 0 ? (
                <div className="company-placeholder">
                    <div>👈 좌측에서 업체를 등록하거나<br />선택해주세요</div>
                </div>
            ) : (
                <>
                    <div className="company-form-container">
                        <div className="company-form-group">
                            <label className="company-form-label">
                                업체명 <span className="company-form-label-required">*</span>
                            </label>
                            <input 
                                value={form.name}
                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                disabled={isDisabled}
                                className="company-form-input"
                                placeholder="업체명을 입력하세요"
                            />
                        </div>

                        <div className="company-form-row">
                            <div className="company-form-col">
                                <label className="company-form-label">대표자명</label>
                                <input
                                    value={form.representative}
                                    onChange={e => setForm(prev => ({ ...prev, representative: e.target.value }))}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                />
                            </div>
                            <div className="company-form-col">
                                <label className="company-form-label">대표 전화</label>
                                <input
                                    value={form.contact}
                                    onChange={e => onContactChange(e.target.value)}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                    placeholder="010-0000-0000"
                                />
                            </div>
                        </div>

                        <div className="company-form-group">
                            <label className="company-form-label">사업자등록번호</label>
                            <input
                                value={form.businessNumber}
                                onChange={e => onBusinessNumberChange(e.target.value)}
                                disabled={isDisabled}
                                className="company-form-input"
                                placeholder="000-00-00000"
                            />
                        </div>

                        <div className="company-form-row">
                            <div className="company-form-col" style={{ flex: 2 }}>
                                <label className="company-form-label">주소</label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                    placeholder="기본 주소"
                                />
                            </div>
                            <div className="company-form-col" style={{ flex: 1 }}>
                                <label className="company-form-label">우편번호</label>
                                <input
                                    value={form.postalCode}
                                    onChange={e => setForm(prev => ({ ...prev, postalCode: e.target.value }))}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                    placeholder="00000"
                                />
                            </div>
                        </div>

                        <div className="company-form-group">
                            <label className="company-form-label">상세주소</label>
                            <input
                                value={form.addressDetail}
                                onChange={e => setForm(prev => ({ ...prev, addressDetail: e.target.value }))}
                                disabled={isDisabled}
                                className="company-form-input"
                                placeholder="상세 주소 입력"
                            />
                        </div>

                        <div className="company-form-row">
                            <div className="company-form-col">
                                <label className="company-form-label">이메일</label>
                                <input
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                    placeholder="example@company.com"
                                    type="email"
                                />
                            </div>
                            <div className="company-form-col">
                                <label className="company-form-label">팩스</label>
                                <input
                                    value={form.fax}
                                    onChange={e => onFaxChange(e.target.value)}
                                    disabled={isDisabled}
                                    className="company-form-input"
                                    placeholder="02-0000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    {(canCreateCompany || canUpdateCompany || canDeleteCompany) && (
                        <div className="company-button-container">
                            {form.id && canDeleteCompany && (
                                <>
                                    {form.active ? (
                                        <button onClick={onDelete} className="company-btn-delete">삭제(비활성)</button>
                                    ) : (
                                        <button onClick={onRestore} className="company-btn-restore">복구(활성화)</button>
                                    )}
                                </>
                            )}
                            {form.id ? (
                                canUpdateCompany && (
                                    <button onClick={onSave} className="company-btn-save">변경사항 저장</button>
                                )
                            ) : (
                                canCreateCompany && (
                                    <button onClick={onSave} className="company-btn-save">업체 등록</button>
                                )
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    )
}