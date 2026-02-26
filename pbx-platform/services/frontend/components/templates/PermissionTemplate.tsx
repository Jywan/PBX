"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchPermissionTemplates, savePermissionTemplate, updatePermissionTemplateStatus, deletePermissionTemplate } from "@/lib/api/permissions";
import "@/styles/templates/permissionTemplate.css";
import Toast from "@/components/common/Toast";
import { ActiveIcon, InactiveIcon } from "@/components/common/Icons";

import ConfirmModal from "../common/ConfirmModal";
import { useConfirmModal } from "@/hooks/useConfirmModal";

export default function PermissionTemplate() {
    const router = useRouter();
    const { token, isLoading: authLoading } = useAuth();

    // --- UI State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- Form State ---
    const [menuName, setMenuName] = useState("");
    const [menuCode, setMenuCode] = useState("");
    const [actions, setActions] = useState([{ id: null, name: "", code: "", is_active: true }]);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- Custom Modal ---
    const { isOpen, message, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const { toast, showToast } = useToast();

    // --- Effects ---
    useEffect(() => {
        if (!authLoading && token) {
            fetchTemplates();
        }
    }, [token, authLoading]);

    // --- API Handlers ---

    const fetchTemplates = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchPermissionTemplates(token);
            setTemplates(data);
        } catch (error: any) {
            console.error("Fetch Error:", error);
            if (error.response?.status === 401) {
                router.push("/login");
            }
        } finally { setLoading(false); }
    };

    // 1. 메뉴 재활성화
    const handleReactivateClick = (id: number, name: string) => {
        openConfirm(
            `'${name}' 메뉴를 다시 활성화 하시겠습니까?`,
            () => executeReactivate(id)
        );
    };

    const executeReactivate = async (id: number) => {
        if (!token) return;
        try {
            await updatePermissionTemplateStatus(token, id, true);
            showToast("정상적으로 활성화 되었습니다.", "success");
            fetchTemplates();
        } catch (err: any) {
            showToast("활성화 작업에 실패했습니다.", "error");
        }
    };
    
    // 2. 메뉴 비활성화
    const handleDeleteClick = (id: number, name: string) => {
        openConfirm(
            `'${name}' 메뉴를 비활성화하시겠습니까?`,
            () => executeDelete(id)
        );
    };

    const executeDelete = async (id: number) => {
        if (!token) return;
        try {
            await deletePermissionTemplate(token, id);
            showToast("비활성화 처리가 완료되었습니다.", "success");
            fetchTemplates();
        } catch (error: any) {
            showToast("처리에 실패했습니다.", "error");
        }
    };

    // 3. 저장 로직
    const handleSave = async () => {
        if (!token) return;

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

            await savePermissionTemplate(token, payload);

            showToast("DB에 성공적으로 반영되었습니다.", "success");
            setIsDrawerOpen(false);
            fetchTemplates();
        } catch (error: any) {
            showToast("저장 중 오류가 발생했습니다.", "error");
        }
    };

    // --- UI Handlers ---
    const openDrawer = (data: any = null) => {
        if (data) {
            setMenuName(data.name); 
            setMenuCode(data.code);
            // 자식 액션들의 상태(is_active)를 그대로 가져옴
            setActions(data.children && data.children.length > 0 
                ? data.children.map((c: any) => ({ 
                    id: c.id, 
                    name: c.name, 
                    code: c.code, 
                    is_active: c.is_active ?? true // DB값 우선, 없으면 true
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

    const addAction = () => setActions([...actions, { id: null, name: "", code: "", is_active: true }]);
    const removeAction = (index: number) => setActions(actions.filter((_, i) => i !== index));
    
    const updateAction = (index: number, field: string, value: any) => {
        setActions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    return (
        <div className="perm-container">
            <Toast toast={toast} />

            <ConfirmModal 
                isOpen={isOpen}
                message={message}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />

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
                            <th style={{ width: '80px', textAlign: 'center' }}>상태</th>
                            <th style={{ width: '200px' }}>메뉴 명</th>
                            <th style={{ width: '250px' }}>식별 코드</th>
                            <th>등록된 액션</th>
                            <th style={{ width: '180px', textAlign: 'center' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>데이터 로딩 중...</td></tr>
                        ) : templates.map((tpl: any) => (
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
                                        <button className="btn-delete" onClick={() => handleDeleteClick(tpl.id, tpl.name)}>비활성</button>
                                    ) : (
                                        <button className="btn-reactivate" onClick={() => handleReactivateClick(tpl.id, tpl.name)}>재활성</button>
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
                        <div className="drawer-body">
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
                                            <input type="checkbox" checked={action.is_active} onChange={(e) => updateAction(idx, 'is_active', e.target.checked)} />
                                            <span className="slider"></span>
                                        </label>
                                        <input className="form-input flex-1" placeholder="액션명" value={action.name} onChange={e => updateAction(idx, 'name', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                        <input className="form-input flex-1" placeholder="코드" value={action.code} onChange={e => updateAction(idx, 'code', e.target.value)} style={{ opacity: action.is_active ? 1 : 0.5 }} />
                                        <button className="btn-remove" onClick={() => removeAction(idx)}>×</button>
                                    </div>
                                ))}
                            </div>
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