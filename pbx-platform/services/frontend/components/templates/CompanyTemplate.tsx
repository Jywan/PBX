"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "@/styles/templates/company.css";
import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";

export default function CompanyTemplate() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // --- 🔐 권한 시뮬레이션 ---
    const [isSystemAdmin, setIsSystemAdmin] = useState(true);

    // --- State ---
    const [companies, setCompanies] = useState([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // 💡 [수정됨] 백엔드 DTO 변경에 맞춰 State 키값 변경
    const [form, setForm] = useState({
        id: null,
        name: "",           // company_name -> name
        representative: "", // ceo_name -> representative
        contact: "",        // ceo_phone -> contact
        active: true        // is_active -> active
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null; isExiting: boolean }>({ message: "", type: null, isExiting: false });

    // --- Helpers ---
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isExiting: false });
        setTimeout(() => setToast(prev => ({ ...prev, isExiting: true })), 2600);
        setTimeout(() => setToast({ message: "", type: null, isExiting: false }), 3000);
    };

    // --- Data Fetching ---
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                if (isSystemAdmin) {
                    const res = await axios.get(`${API_URL}/api/v1/companies`);
                    setCompanies(res.data);
                    if (res.data.length > 0) handleSelectCompany(res.data[0]);
                } else {
                    // Mock Data: 매니저용
                    const myCompany = {
                        id: 99,
                        name: "내 업체 (매니저 모드)", // Changed
                        representative: "김담당",      // Changed
                        contact: "010-1234-5678",      // Changed
                        active: true                   // Changed
                    };
                    handleSelectCompany(myCompany);
                }
            } catch (err) {
                console.error(err);
                showToast("데이터 로딩 실패", "error");
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [isSystemAdmin]);

    // --- Handlers ---
    const handleSelectCompany = (comp: any) => {
        setSelectedId(comp.id);
        // 💡 [수정됨] 받아온 데이터(comp)의 바뀐 키값을 form에 세팅
        setForm({
            id: comp.id,
            name: comp.name,
            representative: comp.representative || "",
            contact: comp.contact || "",
            active: comp.active
        });
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        // 💡 [수정됨] 초기화 값도 변경
        setForm({ id: null, name: "", representative: "", contact: "", active: true });
    };

    const handleSave = async () => {
        // 💡 [수정됨] 유효성 검사 키값 변경
        if (!form.name) return showToast("업체명은 필수입니다.", "error");

        try {
            if (form.id) {
                await axios.patch(`${API_URL}/api/v1/companies/${form.id}`, form);
                showToast("저장되었습니다.", "success");
                
                if (isSystemAdmin) {
                    const res = await axios.get(`${API_URL}/api/v1/companies`);
                    setCompanies(res.data);
                }
            } else {
                await axios.post(`${API_URL}/api/v1/companies`, form);
                showToast("신규 등록 완료", "success");
                const res = await axios.get(`${API_URL}/api/v1/companies`);
                setCompanies(res.data);
            }
        } catch (err) {
            showToast("저장 실패", "error");
        }
    };

    return (
        <div className="company-container">
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

            {isSystemAdmin && (
                <section className="company-col company-col-list">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                        <h3 className="company-title" style={{margin:0}}>업체 목록</h3>
                        <button 
                            onClick={handleCreateNew}
                            style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'12px', cursor:'pointer'}}
                        >
                            + 신규
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
                        {loading && <div style={{fontSize:'12px', color:'#999', textAlign:'center'}}>로딩 중...</div>}
                        {companies.map((comp: any) => (
                            <div 
                                key={comp.id} // 💡 이제 백엔드에서 id를 주므로 에러 안 남!
                                onClick={() => handleSelectCompany(comp)}
                                style={{ 
                                    padding:'12px', borderRadius:'8px', cursor:'pointer',
                                    border: selectedId === comp.id ? '1px solid #3b82f6' : '1px solid #f3f4f6',
                                    backgroundColor: selectedId === comp.id ? '#eff6ff' : '#f9fafb'
                                }}
                            >
                                {/* 💡 [수정됨] 렌더링 키값 변경 */}
                                <div style={{ fontWeight: 600, fontSize:'14px', color:'#333' }}>{comp.name}</div>
                                <div style={{ fontSize:'12px', color:'#888', marginTop:'4px' }}>
                                    {comp.representative || '대표자 미등록'} 
                                    <span style={{float:'right', color: comp.active ? '#10b981' : '#ccc'}}>●</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #eee' }}>
                        <label style={{ fontSize:'11px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' }}>
                            <input type="checkbox" checked={isSystemAdmin} onChange={e => setIsSystemAdmin(e.target.checked)} />
                            관리자 권한 시뮬레이션
                        </label>
                    </div>
                </section>
            )}

            <section className="company-col company-col-base">
                <h3 className="company-title">업체 기본 정보</h3>
                
                <div style={{ flex: 1, display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>
                            업체명 <span style={{color:'red'}}>*</span>
                        </label>
                        {/* 💡 [수정됨] input value 바인딩 변경 */}
                        <input 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})}
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
                                style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}
                            />
                        </div>
                        <div style={{ flex:1 }}>
                            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>대표 전화</label>
                            <input 
                                value={form.contact} 
                                onChange={e => setForm({...form, contact: e.target.value})}
                                style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px' }}
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#666', marginBottom:'6px'}}>운영 상태</label>
                        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={form.active} 
                                onChange={e => setForm({...form, active: e.target.checked})}
                                style={{ width:'16px', height:'16px' }}
                            />
                            <span style={{ fontSize:'13px' }}>
                                {form.active ? '운영 중 (Active)' : '운영 중지 (Inactive)'}
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ marginTop:'20px', textAlign:'right' }}>
                    <button 
                        onClick={handleSave}
                        style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', padding:'10px 20px', fontWeight:600, cursor:'pointer' }}
                    >
                        {form.id ? '변경사항 저장' : '업체 등록'}
                    </button>
                </div>
            </section>

            <section className="company-col company-col-extra">
                <h3 className="company-title">연동 및 부가 설정</h3>
                <div className="company-placeholder">
                    <div>
                        <div style={{ fontSize:'24px', marginBottom:'8px' }}>⚙️</div>
                        API 키 관리, IVR 기본 설정 등<br/>추가 기능이 배치될 영역
                    </div>
                </div>
            </section>
        </div>
    );
}