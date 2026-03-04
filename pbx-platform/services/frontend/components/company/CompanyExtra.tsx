"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Company, CompanyFormState } from "@/types/company";

interface CompanyExtraProps {
    form: CompanyFormState;
    setForm: Dispatch<SetStateAction<CompanyFormState>>;
    selectedId: number | null;
    companies: Company[];
    canCreateCompany: boolean;
    canUpdateCompany: boolean;
}

export default function CompanyExtra({
    form, setForm, selectedId, companies,
    canCreateCompany, canUpdateCompany
}: CompanyExtraProps) {
    const isDisabled = form.id ? !canUpdateCompany : !canCreateCompany;

    return (
        <section className="company-col company-col-extra">
            <h3 className="company-title">연동 및 부가 설정</h3>
            {!selectedId && companies.length === 0 ? (
                <div className="company-placeholder">업체를 먼저 선택해주세요</div>
            ) : (
                <div className="col-body">
                    <div className="company-setting-box">
                        <label className="company-setting-label">
                            콜백 기능 사용
                            <input
                                type="checkbox"
                                checked={form.callback}
                                disabled={isDisabled}
                                onChange={e => setForm(prev => ({ ...prev, callback: e.target.checked }))}
                                className="company-checkbox"
                            />
                        </label>
                        <p className="company-setting-description">
                            상담원 연결 실패 시 고객에게 콜백(Callback) 옵션을 제공합니다.<br />
                            <span className="company-setting-highkight">* 활성화 시 ARS 시나리오에 반영됩니다.</span>
                        </p>
                    </div>
                    <div className="company-placeholder-box">
                        API Key 설정 및<br />IVR 시나리오 연동 준비중
                    </div>
                </div>
            )}
        </section>
    );
}