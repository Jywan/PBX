"use client";

import { ActiveIcon, InactiveIcon } from "@/components/common/Icons";

interface PermissionTableProps {
    loading: boolean;
    templates: any[];
    onEdit: (tpl: any) => void;
    onDelete: (id: number, name: string) => void;
    onReactivate: (id: number, name: string) => void;
}

export default function PermissionTable({ loading, templates, onEdit, onDelete, onReactivate }: PermissionTableProps) {
    return (
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
                                <button className="btn-edit" onClick={() => onEdit(tpl)}>수정</button>
                                {tpl.is_active ? (
                                    <button className="btn-delete" onClick={() => onDelete(tpl.id, tpl.name)}>비활성</button>
                                ) : (
                                    <button className="btn-reactivate" onClick={() => onReactivate(tpl.id, tpl.name)}>재활성</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
