"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "@/styles/templates/company.css"; // 스타일은 기존 company.css 재사용 (유사한 레이아웃)
import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";

// 공통 모달 & 훅 import
import ConfirmModal from "@/components/common/ConfirmModal";
import { useConfirmModal } from "@/hooks/useConfirmModal";

export default function UserTemplate() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    // --- Auth & Data State ---
    const [token, setToken] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]); // 업체 목록 (Dropdown용)
    const [loading, setLoading] = useState(false); // 초기 데이터 로딩
    const [saving, setSaving] = useState(false);   // 저장(생성/수정) 중 여부
    const [deletingId, setDeletingId] = useState<number | null>(null); // 삭제 중인 사용자 ID

    // --- UI State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const { isOpen, message, onConfirm, openConfirm, closeConfirm } = useConfirmModal(); // 커스텀 훅 사용

    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterCompanyName, setFilterCompanyName] = useState<string>("all");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [showInactive, setShowInactive] = useState(false);

    // --- Form State ---
    const [formData, setFormData] = useState({
        id: null,
        username: "",     // API: username (DB: account)
        password: "",     // API: password (DB: account_pw), 생성 시 필수, 수정 시 선택
        name: "",
        extension: "",    // API: extension (DB: exten)
        role: "AGENT",    // 기본값 상담원
        company_id: ""    // 소속 업체 ID
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null; isExiting: boolean }>({ message: "", type: null, isExiting: false });

    // --- Helpers ---
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isExiting: false });
        setTimeout(() => setToast(prev => ({ ...prev, isExiting: true })), 2600);
        setTimeout(() => setToast({ message: "", type: null, isExiting: false }), 3000);
    };

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    // --- Effects ---
    useEffect(() => {
        const cookieToken = getCookie("access_token");
        if (!cookieToken) { router.push("/login"); return; }
        setToken(cookieToken);
    }, [router]);

    useEffect(() => {
        if (token) {
            fetchInitialData();
        }
    }, [token]);

    // --- API Handlers ---
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. 사용자 목록 조회
            const userRes = await axios.get(`${API_URL}/api/v1/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(userRes.data);

            // 2. 업체 목록 조회 (드롭다운용)
            // 관리자라면 업체 목록이 필요함
            const compRes = await axios.get(`${API_URL}/api/v1/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(compRes.data);

        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401) router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!token) return;

        // 유효성 검사
        if (!formData.username || !formData.name) return showToast("아이디와 이름은 필수입니다.", "error");
        if (!isEditMode && !formData.password) return showToast("비밀번호를 입력해주세요.", "error");
        if (!formData.company_id) return showToast("소속 업체를 선택해주세요.", "error");

        setSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 데이터 정제 (빈 비밀번호는 전송 제외)
            const payload = { ...formData };
            if (isEditMode && !payload.password) delete (payload as any).password; // 수정 시 비번 없으면 제외

            if (isEditMode && formData.id) {
                // 수정 (PATCH)
                await axios.patch(`${API_URL}/api/v1/users/${formData.id}`, payload, config);
                showToast("정보가 수정되었습니다.", "success");
            } else {
                // 생성 (POST)
                await axios.post(`${API_URL}/api/v1/users`, payload, config);
                showToast("신규 상담원이 등록되었습니다.", "success");
            }

            setIsDrawerOpen(false);
            fetchInitialData(); // 목록 갱신
        } catch (error: any) {
            console.error(error);
            showToast("저장 실패: " + (error.response?.data?.detail || "오류 발생"), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (user: any) => {
        openConfirm(
            `'${user.name}' 상담원을 정말 삭제(비활성) 하시겠습니까?`,
            () => executeDelete(user.id)
        );
    };

    const executeDelete = async (id: number) => {
        if (!token) return;
        setDeletingId(id);
        try {
            // 삭제 API 호출 (Soft Delete 가정)
            await axios.delete(`${API_URL}/api/v1/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("삭제되었습니다.", "success");
            fetchInitialData();
        } catch (error: any) {
            showToast("삭제 실패", "error");
        } finally {
            setDeletingId(null);
        }
    };

    // --- UI Handlers ---
    const openDrawer = (user: any = null) => {
        if (user) {
            // 수정 모드 (API 응답: username, extension)
            setFormData({
                id: user.id,
                username: user.username,
                password: "", // 보안상 비워둠 (변경 시에만 입력)
                name: user.name,
                extension: user.extension || "",
                role: user.role || "AGENT",
                company_id: user.company_id || ""
            });
            setIsEditMode(true);
        } else {
            // 생성 모드
            setFormData({
                id: null,
                username: "",
                password: "",
                name: "",
                extension: "",
                role: "AGENT",
                company_id: companies.length > 0 ? companies[0].id : "" // 첫 번째 업체 기본 선택
            });
            setIsEditMode(false);
        }
        setIsDrawerOpen(true);
    };

    const filteredUsers = users.filter((user: any) => {
        // 1) 활성/비활성 필터: is_active가 명시적으로 false인 경우만 비활성으로 취급
        if (!showInactive && user?.is_active === false) return false;

        // 2) 업체 필터(회사명 기준)
        if (filterCompanyName !== "all") {
            const userCompany = companies.find((c: any) => String(c.id) === String(user.company_id));
            const userCompanyName = (userCompany?.name || "").trim();
            if (userCompanyName !== filterCompanyName) return false;
        }

        // 3) Role 필터
        if (filterRole !== "all" && user?.role !== filterRole) return false;

        // 4) 검색어 (이름 + 계정)
        const kw = searchKeyword.trim().toLowerCase();
        if (kw) {
            const name = String(user?.name || "").toLowerCase();
            const username = String(user?.username || "").toLowerCase();
            if (!name.includes(kw) && !username.includes(kw)) return false;
        }

        return true;
    });

    return (
        <div className="company-container"> {/* 기존 CSS 클래스 재사용 */}
            <style jsx global>{`
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
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

            <ConfirmModal 
                isOpen={isOpen}
                message={message}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />

            {/* 리스트 영역 */}
            <section className="company-col company-col-list" style={{ flex: 1, maxWidth: '100%' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <h3 className="company-title" style={{margin:0}}>사용자 관리</h3>
                    <button 
                        onClick={() => openDrawer()}
                        style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'4px', padding:'6px 12px', fontSize:'13px', cursor:'pointer', fontWeight:600}}
                    >
                        + 신규 등록
                    </button>
                </div>

                {/* 🔍 검색/필터 바 */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center', fontSize:'13px' }}>
                    <input
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        placeholder="이름 또는 계정 검색"
                        style={{ flex:'1 1 180px', minWidth:'160px', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px' }}
                    />

                    <select
                        value={filterCompanyName}
                        onChange={e => setFilterCompanyName(e.target.value)}
                        style={{ flex:'0 0 160px', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', background:'white' }}
                    >
                        <option value="all">전체 업체</option>
                        {companies.map((c: any, index: number) => (
                            <option key={c.id ? c.id : `company-${index}`} value={String(c.name || "")}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        style={{ flex:'0 0 140px', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', background:'white' }}
                    >
                        <option value="all">전체 권한</option>
                        <option value="AGENT">상담원</option>
                        <option value="MANAGER">매니저</option>
                        <option value="SYSTEM_ADMIN">시스템 관리자</option>
                    </select>

                    <label style={{ display:'flex', alignItems:'center', gap:'4px', cursor:'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={e => setShowInactive(e.target.checked)}
                        />
                        <span>비활성 포함</span>
                    </label>
                </div>
                
                <div className="user-list-wrapper" style={{ overflowY: 'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {/* 초기 로딩 시 스켈레톤 카드 */}
                    {loading && (
                        <>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={`skeleton-${index}`}
                                    style={{
                                        padding:'16px',
                                        borderRadius:'8px',
                                        border:'1px solid #f3f4f6',
                                        background:'#f9fafb',
                                        boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
                                        display:'flex',
                                        flexDirection:'column',
                                        gap:'8px'
                                    }}
                                >
                                    <div style={{ width:'40%', height:'14px', borderRadius:'999px', background:'linear-gradient(90deg,#e5e7eb 0%,#f3f4f6 50%,#e5e7eb 100%)', backgroundSize:'200% 100%', animation:'skeleton-loading 1.2s infinite' }} />
                                    <div style={{ width:'70%', height:'12px', borderRadius:'999px', background:'linear-gradient(90deg,#e5e7eb 0%,#f3f4f6 50%,#e5e7eb 100%)', backgroundSize:'200% 100%', animation:'skeleton-loading 1.2s infinite' }} />
                                </div>
                            ))}
                        </>
                    )}
                    
                    {!loading && filteredUsers.length === 0 && (
                        <div style={{ padding:'16px', textAlign:'center', color:'#9ca3af', fontSize:'13px', border:'1px dashed #e5e7eb', borderRadius:'8px' }}>
                            조건에 맞는 사용자가 없습니다.
                        </div>
                    )}

                    {/* 🚨 Key 수정 적용됨 (index 활용) */}
                    {!loading && filteredUsers.map((user: any, index: number) => (
                        <div key={user.id ? user.id : `user-${index}`} style={{ 
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            padding:'16px', background:'white', borderRadius:'8px', border:'1px solid #f3f4f6', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize:'15px', color:'#1f2937', display:'flex', alignItems:'center', gap:'8px' }}>
                                    {user.name}
                                    <span style={{ fontSize:'11px', background:'#e5e7eb', color:'#4b5563', padding:'2px 6px', borderRadius:'4px' }}>{user.username}</span>
                                </div>
                                <div style={{ fontSize:'13px', color:'#6b7280', marginTop:'4px' }}>
                                    내선: {user.extension || '-'} | 권한: {user.role} | 소속: {companies.find(c => c.id === user.company_id)?.name || '알수없음'}
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:'8px' }}>
                                <button 
                                    onClick={() => openDrawer(user)}
                                    disabled={saving}
                                    style={{ padding:'6px 10px', fontSize:'12px', border:'1px solid #d1d5db', background:'white', borderRadius:'4px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                                >수정</button>
                                <button 
                                    onClick={() => handleDeleteClick(user)}
                                    disabled={deletingId === user.id}
                                    style={{ padding:'6px 10px', fontSize:'12px', border:'1px solid #fca5a5', background:'#fef2f2', color:'#dc2626', borderRadius:'4px', cursor: deletingId === user.id ? 'not-allowed' : 'pointer', opacity: deletingId === user.id ? 0.7 : 1 }}
                                >
                                    {deletingId === user.id ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 우측 드로어 (생성/수정 폼) */}
            {isDrawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', zIndex:1000}} />
                    <div className="drawer-content" style={{
                        position:'fixed', top:0, right:0, bottom:0, width:'400px', background:'white', zIndex:1001, 
                        boxShadow:'-4px 0 15px rgba(0,0,0,0.1)', padding:'24px', display:'flex', flexDirection:'column', animation:'slideInRight 0.3s'
                    }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', borderBottom:'1px solid #eee', paddingBottom:'16px' }}>
                            <h3 style={{ margin:0, fontSize:'18px' }}>{isEditMode ? '상담원 정보 수정' : '신규 상담원 등록'}</h3>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer' }}>✕</button>
                        </div>

                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'16px', overflowY:'auto' }}>
                            
                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>소속 업체 <span style={{color:'red'}}>*</span></label>
                                <select 
                                    value={formData.company_id}
                                    onChange={e => setFormData({...formData, company_id: e.target.value})}
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px', background:'white' }}
                                >
                                    <option value="">선택하세요</option>
                                    {/* 🚨 Key 수정 적용됨 (index 활용) */}
                                    {companies.map((comp, index) => (
                                        <option key={comp.id ? comp.id : `comp-${index}`} value={comp.id}>{comp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>계정 ID <span style={{color:'red'}}>*</span></label>
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    disabled={isEditMode} // 수정 시 ID 변경 불가
                                    placeholder="로그인 아이디 (영문/숫자)"
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px', background: isEditMode ? '#f3f4f6' : 'white' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>
                                    비밀번호 {isEditMode ? '(변경 시에만 입력)' : <span style={{color:'red'}}>*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="비밀번호 입력"
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>이름 <span style={{color:'red'}}>*</span></label>
                                <input 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="상담원 실명"
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>내선 번호</label>
                                <input
                                    value={formData.extension}
                                    onChange={e => setFormData({...formData, extension: e.target.value})}
                                    placeholder="예: 201"
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'}}>권한(Role)</label>
                                <select 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    style={{ width:'100%', padding:'10px', border:'1px solid #d1d5db', borderRadius:'6px', background:'white' }}
                                >
                                    <option value="AGENT">상담원 (AGENT)</option>
                                    <option value="MANAGER">매니저 (MANAGER)</option>
                                    <option value="SYSTEM_ADMIN">시스템 관리자 (ADMIN)</option>
                                </select>
                            </div>

                        </div>

                        <div style={{ marginTop:'20px', display:'flex', gap:'10px' }}>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                disabled={saving}
                                style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:'6px', cursor:saving ? 'not-allowed' : 'pointer', fontWeight:600, opacity: saving ? 0.7 : 1 }}
                            >취소</button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                style={{ flex:2, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:saving ? 'not-allowed' : 'pointer', fontWeight:600, opacity: saving ? 0.85 : 1 }}
                            >
                                {saving ? '저장 중...' : (isEditMode ? '수정 완료' : '상담원 등록')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}