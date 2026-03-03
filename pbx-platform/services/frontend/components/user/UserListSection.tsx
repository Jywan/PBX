"use client";

import type { User } from "@/types/user";
import type { Company } from "@/types/company";
import type { ViewMode } from "@/hooks/useUserData";

interface UserListSectionProps {
    loading: boolean;
    canViewUsers: boolean;
    canCreateUser: boolean;
    canUpdateUser: boolean;
    canDeleteUser: boolean;
    canViewPermission: boolean;
    viewMode: ViewMode;
    paginatedUsers: User[];
    totalCount: number;
    companies: Company[];
    saving: boolean;
    deletingId: number | null;
    restoringId: number | null;
    onOpenModal: (user?: User) => void;
    onDeleteClick: (user: User) => void;
    onRestoreClick: (user: User) => void;
    onOpenPermModal: (user: User) => void;
    getRoleBadgeColor: (role: string) => string;
    getRoleLabel: (role: string) => string;
}

export default function UserListSection({
    loading, canViewUsers, canCreateUser, canUpdateUser, canDeleteUser, canViewPermission,
    viewMode, paginatedUsers, totalCount, companies, saving, deletingId, restoringId,
    onOpenModal, onDeleteClick, onRestoreClick, onOpenPermModal,
    getRoleBadgeColor, getRoleLabel,
}: UserListSectionProps) {
    return (
        <div className="user-list-container">
            {!canViewUsers && (
                <div className="user-empty-state">
                    <div className="user-empty-icon">🔒</div>
                    <h3 className="user-empty-title">조회 권한이 없습니다</h3>
                    <p className="user-empty-description">사용자 목록을 조회할 권한이 없습니다. 관리자에게 문의하세요.</p>
                </div>
            )}

            {canViewUsers && loading && (
                <div className="user-loading-container">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="user-skeleton-card">
                            <div className="user-skeleton-line user-skeleton-line-short" />
                            <div className="user-skeleton-line user-skeleton-line-long" />
                        </div>
                    ))}
                </div>
            )}

            {canViewUsers && !loading && totalCount === 0 && (
                <div className="user-empty-state">
                    <div className="user-empty-icon">👤</div>
                    <h3 className="user-empty-title">사용자가 없습니다</h3>
                    <p className="user-empty-description">조건에 맞는 사용자가 없습니다. 새로운 사용자를 등록해보세요.</p>
                    {canCreateUser && <button onClick={() => onOpenModal()} className="user-empty-action">+ 신규 사용자 등록</button>}
                </div>
            )}

            {/* 카드 뷰 */}
            {canViewUsers && !loading && viewMode === "card" && paginatedUsers.length > 0 && (
                <div className="user-card-list">
                    {paginatedUsers.map(user => (
                        <div key={user.id} className="user-card">
                            <div className="user-card-content">
                                <div className="user-card-header">
                                    <span className="user-card-name">{user.name}</span>
                                    <span className="user-card-username">@{user.username}</span>
                                    <span className="user-card-role-badge" style={{ background: getRoleBadgeColor(user.role) }}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                    {user.is_active === false && <span className="user-card-inactive-badge">비활성</span>}
                                </div>
                                <div className="user-card-info">
                                    내선: {user.extension || '-'} | 소속: {companies.find(c => c.id === user.company_id)?.name || '알 수 없음'}
                                </div>
                            </div>
                            <div className="user-card-actions">
                                {canViewPermission && <button onClick={() => onOpenPermModal(user)} className="user-card-perm-btn">🔑 권한</button>}
                                {canUpdateUser && <button onClick={() => onOpenModal(user)} disabled={saving} className="user-card-edit-btn">✏️ 수정</button>}
                                {canDeleteUser && (
                                    user.is_active === false
                                        ? <button onClick={() => onRestoreClick(user)} disabled={restoringId === user.id} className="user-card-restore-btn">{restoringId === user.id ? '♻️ 복구 중...' : '♻️ 재활성화'}</button>
                                        : <button onClick={() => onDeleteClick(user)} disabled={deletingId === user.id} className="user-card-delete-btn">{deletingId === user.id ? '🗑️ 삭제 중...' : '🗑️ 삭제'}</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 테이블 뷰 */}
            {canViewUsers && !loading && viewMode === "table" && paginatedUsers.length > 0 && (
                <div className="user-table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>이름</th><th>계정</th><th>내선</th><th>권한</th><th>상태</th><th>소속</th><th className="center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="name">{user.name}</td>
                                    <td>@{user.username}</td>
                                    <td>{user.extension || '-'}</td>
                                    <td><span className="user-table-role-badge" style={{ background: getRoleBadgeColor(user.role) }}>{getRoleLabel(user.role)}</span></td>
                                    <td><span className={`user-table-status-badge ${user.is_active === false ? 'inactive' : 'active'}`}>{user.is_active === false ? '비활성' : '활성'}</span></td>
                                    <td>{companies.find(c => c.id === user.company_id)?.name || '-'}</td>
                                    <td className="center">
                                        <div className="user-table-actions">
                                            {canViewPermission && <button onClick={() => onOpenPermModal(user)} className="user-table-perm-btn" title="권한 설정">🔑</button>}
                                            {canUpdateUser && <button onClick={() => onOpenModal(user)} className="user-table-edit-btn">✏️</button>}
                                            {canDeleteUser && (
                                                user.is_active === false
                                                    ? <button onClick={() => onRestoreClick(user)} disabled={restoringId === user.id} className="user-table-restore-btn" title="재활성화">♻️</button>
                                                    : <button onClick={() => onDeleteClick(user)} disabled={deletingId === user.id} className="user-table-delete-btn">🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
