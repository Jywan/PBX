"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "@/styles/templates/permissionTemplate.css";
import { ActiveIcon, InactiveIcon } from "@/components/common/Icons";

export default function PermissionTemplate() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [menuName, setMenuName] = useState("");
    const [menuCode, setMenuCode] = useState("");
    
    // 초기값에 is_active: true를 명시
    const [actions, setActions] = useState([{ id: null, name: "", code: "", is_active: true }]);
    const [isEditMode, setIsEditMode] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/v1/permissions/templates`);
            setTemplates(response.data);
        } catch (error) { console.error("Fetch Error:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleReactivate = async (id: number, name: string) => {
        if (!window.confirm(`'${name}' 메뉴를 다시 활성화하시겠습니까?`)) return;
        try {
            await axios.patch(`${API_URL}/api/v1/permissions/template/${id}`, { is_active: true });
            alert("정상 활성화되었습니다.");
            fetchTemplates();
        } catch (error: any) { alert("작업 실패"); }
    };

    const openDrawer = (data: any = null) => {
        if (data) {
            setMenuName(data.name); 
            setMenuCode(data.code);
            // 💡 기존 데이터 로드 시 is_active가 undefined인 경우를 대비해 true 기본값 부여
            setActions(data.children && data.children.length > 0 
                ? data.children.map((c: any) => ({ 
                    id: c.id, 
                    name: c.name, 
                    code: c.code, 
                    is_active: c.is_active ?? true 
                }))
                : [{ id: null, name: "", code: "", is_active: true }]);
            setIsEditMode(true);
        } else {
            setMenuName(""); setMenuCode(""); 
            setActions([{ id: null, name: "", code: "", is_active: true }]);
            setIsEditMode(false);
        }
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                menu_name: menuName,
                menu_code: menuCode,
                actions: actions
                    .filter(a => a.name && a.code)
                    .map(a => ({
                        id: a.id,
                        name: a.name,
                        code: a.code,
                        is_active: a.is_active
                    }))
            };
            
            console.log("전송 데이터 확인:", payload);

            await axios.post(`${API_URL}/api/v1/permissions/template`, payload);
            alert("DB 반영 완료"); 
            setIsDrawerOpen(false); 
            fetchTemplates();
        } catch (error: any) { 
            alert("저장 실패"); 
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`비활성화하시겠습니까?`)) return;
        try {
            await axios.delete(`${API_URL}/api/v1/permissions/template/${id}`);
            fetchTemplates();
        } catch (error: any) { alert("삭제 실패"); }
    };

    const addAction = () => setActions([...actions, { id: null, name: "", code: "", is_active: true }]);
    
    const removeAction = (index: number) => setActions(actions.filter((_, i) => i !== index));
    
    // 💡 개별 필드 업데이트 로직
    const updateAction = (index: number, field: string, value: any) => {
        setActions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    return (
        <div className="perm-container">
            <header className="perm-header">
                <div className="perm-title-group">
                    <h2>권한 템플릿 설정</h2>
                    <p>개발용 마스터 : 페이지 식별 코드와 세부 실행 권한을 관리합니다.</p>
                </div>
                <button className="btn-primary" onClick={() => openDrawer()}>+ 신규 메뉴 정의</button>
            </header>

            <div className="perm-card">
                <table className="perm-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>상태</th>
                            <th>메뉴 명</th><th>식별 코드</th><th>등록된 액션</th>
                            <th style={{ textAlign: 'center' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map((tpl: any) => (
                            <tr key={tpl.id} className={!tpl.is_active ? 'row-inactive' : ''}>
                                <td style={{ textAlign: 'center' }}>{tpl.is_active ? <ActiveIcon /> : <InactiveIcon />}</td>
                                <td style={{ fontWeight: 700 }}>{tpl.name}</td>
                                <td style={{ color: '#3b82f6', fontFamily: 'monospace' }}>{tpl.code}</td>
                                <td>{tpl.children?.map((a: any) => (
                                    <span key={a.id} className={`tag ${!a.is_active ? 'inactive' : ''}`}>{a.name}</span>
                                ))}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button className="btn-edit" onClick={() => openDrawer(tpl)}>수정</button>
                                    {tpl.is_active ? (
                                        <button className="btn-delete" onClick={() => handleDelete(tpl.id, tpl.name)}>비활성</button>
                                    ) : (
                                        <button className="btn-reactivate" onClick={() => handleReactivate(tpl.id, tpl.name)}>재활성</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isDrawerOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
                    <div className="drawer-content">
                        <div className="drawer-header">
                            <h3>{isEditMode ? `[${menuName}] 규격 수정` : "신규 권한 규격 정의"}</h3>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ border:'none', background:'none', fontSize:'24px', cursor:'pointer' }}>✕</button>
                        </div>
                        <div className="form-section">
                            <label className="form-label">메뉴 기본 정보</label>
                            <div className="flex-gap-10">
                                <input className="form-input" placeholder="메뉴명" value={menuName} onChange={e => setMenuName(e.target.value)} />
                                <input className="form-input" placeholder="코드" value={menuCode} onChange={e => setMenuCode(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-section">
                            <div className="flex-between mb-16">
                                <label className="form-label">하위 액션 선언 및 활성화 설정</label>
                                <button className="btn-text-blue" onClick={addAction}>+ 액션 추가</button>
                            </div>
                            {actions.map((action, idx) => (
                                <div key={idx} className="action-row">
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={action.is_active} 
                                            onChange={(e) => updateAction(idx, 'is_active', e.target.checked)} 
                                        />
                                        <span className="slider"></span>
                                    </label>
                                    <input className="form-input flex-1" placeholder="액션명" value={action.name} onChange={e => updateAction(idx, 'name', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                    <input className="form-input flex-1" placeholder="코드" value={action.code} onChange={e => updateAction(idx, 'code', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                    <button className="btn-remove" onClick={() => removeAction(idx)}>×</button>
                                </div>
                            ))}
                        </div>
                        <div className="drawer-footer">
                            <button className="btn-ghost" onClick={() => setIsDrawerOpen(false)}>취소</button>
                            <button className="btn-primary flex-2" onClick={handleSave}>DB 반영하기</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}