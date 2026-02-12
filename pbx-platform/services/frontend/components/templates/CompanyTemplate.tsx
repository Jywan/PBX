"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import Cookies from "js-cookie";
import "@/styles/templates/company.css";
import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";
import type { Company, CompanyFormState } from "@/types/company";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchCompanies as apiFetchCompanies, createCompany, updateCompany, deactivateCompany } from "@/lib/api/companies";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/utils/validation";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useConfirmModal } from "@/hooks/useConfirmModal";

export default function CompanyTemplate() {
    const router = useRouter();

    const { token, isSystemAdmin, isLoading } = useAuth();
    const { toast, showToast } = useToast();
    const { isOpen, message, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    // --- Data State ---
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // --- Form State ---
    const [form, setForm] = useState<CompanyFormState>({
        id: null,
        name: "",
        representative: "",
        contact: "",
        callback: false,
        active: true
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [sortBy, setSortBy] = useState<"latest" | "oldest" | "name">("latest");

    // --- 데이터 로딩 ---
    useEffect(() => {
        if (!token) return;
        fetchCompanies();
    }, [token]);

    const fetchCompanies = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await apiFetchCompanies(token);
            setCompanies(data);

            if (data.length > 0 && !selectedId) {
                handleSelectCompany(data[0]);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                showToast("세션이 만료되었습니다.", "error");
                setTimeout(() => router.push("/login"), 1500);
            } else {
                showToast("데이터 로딩 실패", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- 검색/필터/정렬된 목록 계산 ---
    const filteredCompanies = useMemo(() => {
        let result = [...companies];

        // 1. 검색 필터 (업체명, 대표자명)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(comp => 
                comp.name.toLowerCase().includes(term) ||
                (comp.representative && comp.representative.toLowerCase().includes(term))
            );
        }

        // 2. 상태 필터
        if (filterStatus === "active") {
            result = result.filter(comp => comp.active);
        } else if (filterStatus === "inactive") {
            result = result.filter(comp => !comp.active);
        }

        // 3. 정렬
        if (sortBy === "latest") {
            result.sort((a, b) => b.id - a.id); // 최신순 (id DESC)
        } else if (sortBy === "oldest") {
            result.sort((a, b) => a.id - b.id); // 오래된순 (id asc)
        } else if (sortBy === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name, 'ko'));  // 이름순 (한글고려)
        }

        return result;
    }, [companies, searchTerm, filterStatus, sortBy]);

    // --- Handlers ---
    const handleSelectCompany = (comp: Company) => {
        setSelectedId(comp.id);
        setForm({
            id: comp.id,
            name: comp.name,
            representative: comp.representative || "",
            contact: comp.contact || "",
            callback: comp.callback || false,
            active: comp.active
        });
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        setForm({ 
            id: null, 
            name: "", 
            representative: "", 
            contact: "", 
            callback: false, 
            active: true 
        });
    };

    const handleContactChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        setForm({ ...form, contact: formatted });
    }

    const handleSave = async () => {
        if (!form.name) return showToast("업체명은 필수입니다.", "error");
        if (!token) return;

        // 전화번호 검증
        if (form.contact && !validatePhoneNumber(form.contact)) {
            return showToast("올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)", "error");
        }

        try {
            if (form.id) {
                await updateCompany(token, form.id, form);
                showToast("저장되었습니다.", "success");
            } else {
                await createCompany(token, form);
                showToast("신규 등록 완료", "success");
            }
            fetchCompanies();
        } catch (err: any) {
            console.error(err);
            showToast("저장 실패: " + (err.response?.data?.detail || "오류 발생"), "error");
        }
    };

    const handleDelete = async () => {
        if (!form.id || !token) return;
        
        openConfirm(`'${form.name}' 업체를 비활성화(삭제) 하시겠습니까?`, async () => {
            try {
                await deactivateCompany(token, form.id!);
                showToast("업체가 비활성화 되었습니다.", "success");
                fetchCompanies();
            } catch (err) {
                showToast("처리 실패", "error");
            }
        });
    };
    
    if (isLoading) {
        return <div style={{textAlign: 'center', padding:'50px'}}>로딩 중...</div>
    }

    return (
        <div className="company-container">
            {/* 토스트 코드 */}
            {toast.type && (
                <div className="toast-container">
                    <div className={`toast ${toast.type} ${toast.isExiting ? 'exit' : ''}`}>
                        <div className="toast-icon-wrapper">
                            {toast.type === 'success' ? <SuccessIcon className="toast-icon success" /> : <ErrorIcon className="toast-icon error" />}
                        </div>
                        {toast.message}
                    </div>
                </div>
            )}

            {/* 커스텀 모달 */}
            <ConfirmModal 
                isOpen={isOpen}
                title="비활성화 확인"
                message={message}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />

            {/* 1열: 목록 */}
            <section className="company-col company-col-list">
                <div className="company-list-header">
                    <h3 className="company-title" style={{margin:0}}>업체 목록</h3>
                    {isSystemAdmin && (
                        <button onClick={handleCreateNew} className="company-add-btn">
                            + 신규
                        </button>
                    )}
                </div>

                <div className="company-search-filter-container">
                    {/* 검색창 */}
                    <input
                        type="text"
                        placeholder="업체명 또는 대표자명 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="company-search-input"
                    />

                    {/* 필터, 정렬 */}
                    <div className="company-filter-sort-container">
                        {/* 상태 필터 */}
                        <div className="company-filter-buttons">
                            {(['all', 'active', 'inactive'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`company-filter-btn ${filterStatus === status ? 'active' : ''}`}
                                >
                                    {status === 'all' ? '전체' : status === 'active' ? '활성' : '비활성'}
                                </button>
                            ))}
                        </div>

                        {/* 정렬 */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "latest" | "oldest" | "name")}
                            className="company-sort-select"
                        >
                            <option value="latest">최신순</option>
                            <option value="oldest">오래된순</option>
                            <option value="name">이름순</option>
                        </select>
                    </div>
                </div>

                <div className="company-list-container">
                    {loading && <div className="company-loading">로딩 중...</div>}
                    {filteredCompanies.length === 0 && !loading && (
                        <div className="company-no-results">
                            검색 결과가 없습니다.
                        </div>
                    )}
                    {filteredCompanies.map((comp: Company) => (
                        <div 
                            key={comp.id}
                            onClick={() => handleSelectCompany(comp)}
                            style={{ 
                                padding:'12px', borderRadius:'8px', cursor:'pointer',
                                border: selectedId === comp.id ? '1px solid #3b82f6' : '1px solid #f3f4f6',
                                backgroundColor: selectedId === comp.id ? '#eff6ff' : '#f9fafb'
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize:'14px', color:'#333' }}>{comp.name}</div>
                            <div style={{ fontSize:'12px', color:'#888', marginTop:'4px' }}>
                                {comp.representative || '대표자 미등록'} 
                                <span style={{float:'right', color: comp.active ? '#10b981' : '#ccc'}}>●</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2열: 기본 정보 */}
            <section className="company-col company-col-base">
                <h3 className="company-title">업체 기본 정보</h3>
                <div style={{ flex: 1, display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>
                            업체명 <span style={{color:'red'}}>*</span>
                        </label>
                        <input 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})}
                            disabled={!isSystemAdmin}
                            style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}
                            placeholder="업체명을 입력하세요"
                        />
                    </div>
                    <div style={{ display:'flex', gap:'12px' }}>
                        <div style={{ flex:1 }}>
                            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>대표자명</label>
                            <input 
                                value={form.representative} 
                                onChange={e => setForm({...form, representative: e.target.value})}
                                disabled={!isSystemAdmin}
                                style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}
                            />
                        </div>
                        <div style={{ flex:1 }}>
                            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>대표 전화</label>
                            <input 
                                value={form.contact} 
                                onChange={e => handleContactChange(e.target.value)}
                                disabled={!isSystemAdmin}
                                style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>운영 상태</label>
                        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor: isSystemAdmin ? 'pointer' : 'default' }}>
                            <input 
                                type="checkbox" 
                                checked={form.active} 
                                onChange={e => setForm({...form, active: e.target.checked})}
                                disabled={!isSystemAdmin}
                                style={{ width:'16px', height:'16px' }}
                            />
                            <span style={{ fontSize:'13px' }}>
                                {form.active ? '운영 중 (Active)' : '운영 중지 (Inactive)'}
                            </span>
                        </label>
                    </div>
                </div>

                {isSystemAdmin && (
                    <div style={{ marginTop:'20px', display:'flex', justifyContent:'space-between' }}>
                        {form.id && (
                            <button 
                                onClick={handleDelete}
                                style={{ background:'#ef4444', color:'white', border:'none', borderRadius:'6px', padding:'10px 16px', fontWeight:600, cursor:'pointer' }}
                            >
                                삭제(비활성)
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', padding:'10px 20px', fontWeight:600, cursor:'pointer', marginLeft:'auto' }}
                        >
                            {form.id ? '변경사항 저장' : '업체 등록'}
                        </button>
                    </div>
                )}
            </section>

            {/* 3열: 부가 설정 */}
            <section className="company-col company-col-extra">
                <h3 className="company-title">연동 및 부가 설정</h3>
                <div className="col-body">
                    <div className="form-group" style={{ padding:'15px', background:'#f9fafb', borderRadius:'8px', border: '1px solid #eee' }}>
                        <label className="form-label" style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:600, fontSize:'13px'}}>
                            콜백 기능 사용
                            <input 
                                type="checkbox" 
                                checked={form.callback} 
                                disabled={!isSystemAdmin}
                                onChange={e => setForm({...form, callback: e.target.checked})} 
                                style={{ width:'16px', height:'16px', cursor:'pointer' }}
                            />
                        </label>
                        <p style={{fontSize:'12px', color:'#6b7280', marginTop:'8px', lineHeight: 1.4}}>
                            상담원 연결 실패 시 고객에게 콜백(Callback) 옵션을 제공합니다.<br/>
                            <span style={{color:'#3b82f6'}}>* 활성화 시 ARS 시나리오에 반영됩니다.</span>
                        </p>
                    </div>
                    <div style={{ marginTop:'15px', padding:'15px', background:'#f9fafb', borderRadius:'8px', border: '1px solid #eee', color:'#9ca3af', fontSize:'13px', textAlign:'center' }}>
                        API Key 설정 및<br/>IVR 시나리오 연동 준비중
                    </div>
                </div>
            </section>
        </div>
    );
}