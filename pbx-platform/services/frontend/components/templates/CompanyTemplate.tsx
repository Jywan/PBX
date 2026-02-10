"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import axios from "axios";
import "@/styles/templates/company.css";
import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";

export default function CompanyTemplate() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const router = useRouter();

    // --- Auth State ---
    const [token, setToken] = useState<string | null>(null);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);

    // --- Data State ---
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [form, setForm] = useState({
        id: null,
        name: "",
        representative: "",
        contact: "",
        callback: false,
        active: true
    });

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null; isExiting: boolean }>({ message: "", type: null, isExiting: false });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isExiting: false });
        setTimeout(() => setToast(prev => ({ ...prev, isExiting: true })), 2600);
        setTimeout(() => setToast({ message: "", type: null, isExiting: false }), 3000);
    };

    // 쿠키 유틸리티 함수
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    // --- 1. 초기화 (토큰 체크 & 권한 확인) ---
    useEffect(() => {
        const cookieToken = getCookie("access_token");

        // 토큰이 없으면 로그인 페이지로 이동
        if (!cookieToken) {
            router.push("/login");
            return;
        }

        setToken(cookieToken);

        // 토큰 파싱 (Role 확인)
        try {
            const payloadBase64 = cookieToken.split('.')[1];
            // 한글 및 특수문자 깨짐 방지 디코딩
            const decodedString = decodeURIComponent(escape(window.atob(payloadBase64)));
            const decodedPayload = JSON.parse(decodedString);
            
            // 권한 체크 (문자열 "SYSTEM_ADMIN" 또는 숫자 0/문자 "0" 모두 허용)
            const role = decodedPayload.role;
            if (role === "SYSTEM_ADMIN" || role === 0 || role === "0") {
                setIsSystemAdmin(true);
            } 
        } catch (e) {
            console.error("Token parsing error:", e);
            // 파싱 실패 시 보안을 위해 로그인 페이지로 보낼 수도 있음
            // router.push("/login");
        }
    }, [router]);

    // --- 2. 데이터 로딩 ---
    useEffect(() => {
        if (!token) return;
        fetchCompanies();
    }, [token]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/v1/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(res.data);
            
            if (res.data.length > 0 && !selectedId) {
                handleSelectCompany(res.data[0]);
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

    // --- Handlers ---
    const handleSelectCompany = (comp: any) => {
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

    const handleSave = async () => {
        if (!form.name) return showToast("업체명은 필수입니다.", "error");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (form.id) {
                await axios.patch(`${API_URL}/api/v1/companies/${form.id}`, form, { headers });
                showToast("저장되었습니다.", "success");
            } else {
                await axios.post(`${API_URL}/api/v1/companies`, form, { headers });
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
        if (!window.confirm(`'${form.name}' 업체를 비활성화(삭제) 하시겠습니까?`)) return;

        try {
            await axios.patch(`${API_URL}/api/v1/companies/${form.id}`, 
                { active: false }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast("업체가 비활성화 되었습니다.", "success");
            fetchCompanies();
        } catch (err) {
            showToast("처리 실패", "error");
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

            {/* 1열: 목록 */}
            <section className="company-col company-col-list">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <h3 className="company-title" style={{margin:0}}>업체 목록</h3>
                    {isSystemAdmin && (
                        <button 
                            onClick={handleCreateNew}
                            style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'12px', cursor:'pointer'}}
                        >
                            + 신규
                        </button>
                    )}
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {loading && <div style={{fontSize:'12px', color:'#999', textAlign:'center'}}>로딩 중...</div>}
                    {companies.map((comp: any) => (
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
                                onChange={e => setForm({...form, contact: e.target.value})}
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