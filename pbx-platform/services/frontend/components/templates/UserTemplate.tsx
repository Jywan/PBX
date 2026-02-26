"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import "@/styles/templates/user.css";
import Toast from "@/components/common/Toast";

import { useAuth } from "@/hooks/useAuth";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchUsers, createUser, updateUser, deleteUser, restoreUser } from "@/lib/api/users";
import { fetchPermissionTemplates, fetchUserPermissions, assignUserPermissions } from "@/lib/api/permissions";
import type { User } from "@/types/user";

// 공통 모달 & 훅 import
import ConfirmModal from "@/components/common/ConfirmModal";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { useToast } from "@/hooks/useToast";
import AccessDeniedModal from "@/components/common/AccessDeniedModal";
import { useAccessDenied } from "@/hooks/useAccessDenied";
import { hasPermission } from "@/lib/auth";

type ViewMode = "card" | "table";
type SortField = "name" | "created_at" | "role" | "username";
type SortOrder = "asc" | "desc";

interface UserTemplateProps {
    onAccessDenied?: () => void;
}

export default function UserTemplate({ onAccessDenied }: UserTemplateProps) {
    const router = useRouter();

    // --- Auth & Data State ---
    const { token, isSystemAdmin, companyId, isLoading: authLoading } = useAuth();

    // --- Menu 권한 체크 ---
    const { isDenied, isChecking } = useAccessDenied({
        requiredPermission: "agent"
    });

    // --- Action 권한 체크 ---
    const canViewUsers = isSystemAdmin || hasPermission("agent-detail");
    const canCreateUser = isSystemAdmin || hasPermission("agent-create");
    const canUpdateUser = isSystemAdmin || hasPermission("agent-update");
    const canDeleteUser = isSystemAdmin || hasPermission("agent-delete");
    const canViewPermission = isSystemAdmin || hasPermission("agent-permission")
    const canUpsertPermission = isSystemAdmin || hasPermission("agent-permission-upsert")

    // 디버깅: 권한 상태 로그
    useEffect(() => {
        console.log('[UserTemplate] 권한 체크 상태 - isChecking:', isChecking, 'isDenied:', isDenied);
    }, [isChecking, isDenied]);
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [restoringId, setRestoringId] = useState<number | null>(null);

    // --- UI State ---
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const { isOpen, message, onConfirm, openConfirm, closeConfirm } = useConfirmModal();

    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [showInactive, setShowInactive] = useState(false);

    // --- Sorting & Pagination ---
    const [sortField, setSortField] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Form State ---
    const [formData, setFormData] = useState<{
        id: number | null;
        username: string;
        password: string;
        name: string;
        extension: string;
        role: string;
        company_id: number | null;
    }>({
        id: null,
        username: "",
        password: "",
        name: "",
        extension: "",
        role: "AGENT",
        company_id: null
    });

    // --- 권한 설정 모달 State ---
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [permTargetUser, setPermTargetUser] = useState<User | null>(null);
    const [permTemplates, setPermTemplates] = useState<any[]>([]);
    const [permChecked, setPermChecked] = useState<Set<number>>(new Set());
    const [permLoading, setPermLoading] = useState(false);
    const [permSaving, setPermSaving] = useState(false);

    const { toast, showToast } = useToast();

    // --- Effects ---
    useEffect(() => {
        if (token && !authLoading) {
            fetchInitialData();
        }
    }, [token, authLoading, selectedCompanyId]);

    // --- API Handlers ---
    const fetchInitialData = async () => {
        if (!token) return;
        if (!isSystemAdmin && !hasPermission("agent-detail")) return;

        setLoading(true);
        try {
            const companiesList = await fetchCompanies(token);

            if (isSystemAdmin) {
                // const companiesList = await fetchCompanies(token);
                setCompanies(companiesList);

                // 시스템 관리자는 업체를 선택해야 사용자 목록 조회
                if (!selectedCompanyId) {
                    setUsers([]);
                    setLoading(false);
                    return;
                }
            } else {
                // 시스템 관리자 외
                setCompanies(companiesList.filter(c => c.id === companyId));
            }

            const usersList = await fetchUsers(
                token,
                isSystemAdmin ? (selectedCompanyId || undefined) : (companyId || undefined)
            );
            setUsers(usersList);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401) router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!token) return;

        if (!formData.username || !formData.name) return showToast("아이디와 이름은 필수입니다.", "error");
        if (!isEditMode && !formData.password) return showToast("비밀번호를 입력해주세요.", "error");
        if (!formData.company_id) return showToast("소속 업체를 선택해주세요.", "error");

        setSaving(true);
        try {
            if (isEditMode && formData.id) {
                const updateData: any = {
                    username: formData.username,
                    name: formData.name,
                    extension: formData.extension,
                    role: formData.role
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }

                await updateUser(token, formData.id, updateData);
                showToast("정보가 수정되었습니다.", "success");
            } else {
                await createUser(token, {
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    extension: formData.extension,
                    role: formData.role,
                    company_id: formData.company_id
                });
                showToast("신규 상담원이 등록되었습니다.", "success");
            }

            setIsModalOpen(false);
            fetchInitialData();
        } catch (error: any) {
            console.error(error);

            // 에러 메시지 파싱
            let errorMessage = "오류 발생";

            if (error.response?.data) {
                const errorData = error.response.data;

                // Pydantic validation error (422) - 배열 형식
                if (Array.isArray(errorData.detail)) {
                    const messages = errorData.detail.map((err: any) => {
                        // msg에서 "Value error, " 제거
                        const msg = err.msg || err.message || "";
                        return msg.replace(/^Value error,\s*/, "");
                    });
                    errorMessage = messages.join(", ");
                }
                // 일반 에러 - 문자열 형식
                else if (typeof errorData.detail === "string") {
                    errorMessage = errorData.detail;
                }
            }

            showToast(errorMessage, "error");
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
            await deleteUser(token, id);
            showToast("삭제되었습니다.", "success");
            fetchInitialData();
        } catch (error: any) {
            showToast("삭제 실패", "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleRestoreClick = (user: any) => {
        openConfirm(
            `'${user.name}' 상담원을 재활성화 하시겠습니까?`,
            () => executeRestore(user.id)
        );
    };

    const executeRestore = async (id: number) => {
        if (!token) return;
        setRestoringId(id);
        try {
            await restoreUser(token, id);
            showToast("재활성화되었습니다.", "success");
            fetchInitialData();
        } catch (error: any) {
            showToast("재활성화 실패", "error");
        } finally {
            setRestoringId(null);
        }
    };

    // --- 권한 설정 모달 핸들러 ---
    const openPermModal = async (user: User) => {
        if (!token) return;
        setPermTargetUser(user);
        setIsPermModalOpen(true);
        setPermLoading(true);

        try {
            const [templates, userPermIds] = await Promise.all([
                fetchPermissionTemplates(token),
                fetchUserPermissions(token, user.id)
            ]);
            setPermTemplates(templates);
            setPermChecked(new Set(userPermIds));
        } catch (error: any) {
            console.error(error);
            showToast("권한 정보를 불러오지 못했습니다.", "error");
            setIsPermModalOpen(false);
        } finally {
            setPermLoading(false);
        }
    };

    // 메뉴(MENU) 권한 토글 - 해제 시 하위 액션도 모두 해제
    const handleMenuToggle = (menuId: number) => {
        setPermChecked(prev => {
            const next = new Set(prev);
            if (next.has(menuId)) {
                next.delete(menuId);
            } else {
                next.add(menuId);
            }
            return next;
        });
    };

    // 액션(ACTION) 권한 토글
    const handlePermToggle = (permId: number) => {
        setPermChecked(prev => {
            const next = new Set(prev);
            if (next.has(permId)) {
                next.delete(permId);
            } else {
                next.add(permId);
            }
            return next;
        });
    };

    const handlePermSave = async () => {
        if (!token || !permTargetUser) return;
        setPermSaving(true);

        try {
            // 메뉴별로 그룹핑하여 assign API 호출
            for (const menu of permTemplates) {
                if (!menu.is_active) continue;
                
                const permissionIds: number[] = [];
                
                // 메뉴 권한이 체크되어 있으면 포함
                if (permChecked.has(menu.id)) {
                    permissionIds.push(menu.id);
                }

                // 체크된 액션들 포함
                (menu.children || [])
                    .filter((action: any) => action.is_active && permChecked.has(action.id))
                    .forEach((action: any) => permissionIds.push(action.id));

                await assignUserPermissions(token, {
                    user_id: permTargetUser.id,
                    menu_id: menu.id,
                    permission_ids: permissionIds
                });
            }

            showToast(`'${permTargetUser.name}' 권한이 저장되었습니다.`, "success");
            setIsPermModalOpen(false);
        } catch (error: any) {
            console.error(error);
            showToast("권한 저장에 실패했습니다.", "error");
        } finally {
            setPermSaving(false);
        }
    };

    // --- UI Handlers ---
    const openModal = (user: any = null) => {
        if (user) {
            setFormData({
                id: user.id,
                username: user.username,
                password: "",
                name: user.name,
                extension: user.extension || "",
                role: user.role || "AGENT",
                company_id: user.company_id || null
            });
            setIsEditMode(true);
        } else {
            setFormData({
                id: null,
                username: "",
                password: "",
                name: "",
                extension: "",
                role: "AGENT",
                company_id: isSystemAdmin ? selectedCompanyId : companyId
            });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };

    // --- Filtering & Sorting ---
    const filteredAndSortedUsers = users
        .filter((user: any) => {
            if (!showInactive && user?.is_active === false) return false;
            if (filterRole !== "all" && user?.role !== filterRole) return false;

            const kw = searchKeyword.trim().toLowerCase();
            if (kw) {
                const name = String(user?.name || "").toLowerCase();
                const username = String(user?.username || "").toLowerCase();
                if (!name.includes(kw) && !username.includes(kw)) return false;
            }

            return true;
        })
        .sort((a: any, b: any) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === "created_at") {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // --- Pagination ---
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
    const paginatedUsers = filteredAndSortedUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, filterRole, showInactive, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return "#dc2626";
            case "MANAGER": return "#f59e0b";
            case "AGENT": return "#10b981";
            default: return "#6b7280";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return "시스템 관리자";
            case "MANAGER": return "매니저";
            case "AGENT": return "상담원";
            default: return role;
        }
    };

    // 권한 체크 중
    if (isChecking) {
        return (
            <div className="user-container">
                <div className="user-col user-col-list">
                    <div className="user-header">
                        <h3 className="user-title">사용자 관리</h3>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>권한 확인 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-container">
            {/* 권한 없음 모달 */}
            <AccessDeniedModal
                isOpen={isDenied}
                message="사용자 관리 페이지 접근 권한이 없습니다."
                redirectPath="/"
                onRedirect={onAccessDenied}
            />

            <Toast toast={toast} />

            <ConfirmModal
                isOpen={isOpen}
                message={message}
                onConfirm={onConfirm}
                onClose={closeConfirm}
            />

            {/* 권한이 있을 때만 페이지 표시 */}
            {!isDenied && (
                <>
                    {/* 메인 컨테이너 */}
                    <section className="user-col user-col-list">
                {/* 헤더 */}
                <div className="user-header">
                    <h3 className="user-title">사용자 관리</h3>
                    <div className="user-header-actions">
                        {/* 뷰 토글 */}
                        <div className="user-view-toggle">
                            <button
                                onClick={() => setViewMode("card")}
                                className={`user-view-toggle-btn ${viewMode === "card" ? "active" : ""}`}
                            >
                                📋 카드
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`user-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                            >
                                📊 테이블
                            </button>
                        </div>
                        {canCreateUser && (
                            <button onClick={() => openModal()} className="user-add-btn">
                                + 신규 등록
                            </button>
                        )}
                    </div>
                </div>

                {/* 검색/필터 바 */}
                <div className="user-search-filter-bar">
                    {/* 시스템 관리자 - 업체 선택 */}
                    {isSystemAdmin && (
                        <select
                            value={selectedCompanyId || ''}
                            onChange={e => setSelectedCompanyId(Number(e.target.value))}
                            className="user-company-select"
                        >
                            <option value="">업체 선택</option>
                            {companies.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    <input
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        placeholder="🔍 이름 또는 계정 검색"
                        className="user-search-input"
                    />

                    <select
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="user-filter-select"
                    >
                        <option value="all">전체 권한</option>
                        <option value="AGENT">상담원</option>
                        <option value="MANAGER">매니저</option>
                        <option value="SYSTEM_ADMIN">시스템 관리자</option>
                    </select>

                    <select
                        value={sortField}
                        onChange={e => handleSort(e.target.value as SortField)}
                        className="user-sort-select"
                    >
                        <option value="created_at">생성일순</option>
                        <option value="name">이름순</option>
                        <option value="username">계정순</option>
                        <option value="role">권한순</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="user-sort-order-btn"
                        title={sortOrder === "asc" ? "오름차순" : "내림차순"}
                    >
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </button>

                    <label className="user-checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={e => setShowInactive(e.target.checked)}
                            className="user-checkbox"
                        />
                        <span className="user-checkbox-label">비활성 포함</span>
                    </label>
                </div>

                {/* 결과 개수 */}
                <div className="user-results-count">
                    총 {filteredAndSortedUsers.length}명 | {currentPage} / {totalPages || 1} 페이지
                </div>

                {/* 리스트 영역 */}
                <div className="user-list-container">

                    {/* 조회 권한 없음 */}
                    {!canViewUsers && (
                        <div className="user-empty-state">
                            <div className="user-empty-icon">🔒</div>
                            <h3 className="user-empty-title">조회 권한이 없습니다</h3>
                            <p className="user-empty-description">
                                사용자 목록을 조회할 권한이 없습니다. 관리자에게 문의하세요.
                            </p>
                        </div>
                    )}

                    {/* 로딩 */}
                    {canViewUsers && loading && (
                        <div className="user-loading-container">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={`skeleton-${index}`} className="user-skeleton-card">
                                    <div className="user-skeleton-line user-skeleton-line-short" />
                                    <div className="user-skeleton-line user-skeleton-line-long" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 빈 상태 */}
                    {canViewUsers && !loading && filteredAndSortedUsers.length === 0 && (
                        <div className="user-empty-state">
                            <div className="user-empty-icon">👤</div>
                            <h3 className="user-empty-title">사용자가 없습니다</h3>
                            <p className="user-empty-description">
                                조건에 맞는 사용자가 없습니다. 새로운 사용자를 등록해보세요.
                            </p>
                            {canCreateUser && (
                                <button onClick={() => openModal()} className="user-empty-action">
                                    + 신규 사용자 등록
                                </button>
                            )}
                        </div>
                    )}

                    {/* 카드 뷰 */}
                    {canViewUsers && !loading && viewMode === "card" && paginatedUsers.length > 0 && (
                        <div className="user-card-list">
                            {paginatedUsers.map((user: any) => (
                                <div key={user.id} className="user-card">
                                    <div className="user-card-content">
                                        <div className="user-card-header">
                                            <span className="user-card-name">{user.name}</span>
                                            <span className="user-card-username">@{user.username}</span>
                                            <span
                                                className="user-card-role-badge"
                                                style={{ background: getRoleBadgeColor(user.role) }}
                                            >
                                                {getRoleLabel(user.role)}
                                            </span>
                                            {user.is_active === false && (
                                                <span className="user-card-inactive-badge">비활성</span>
                                            )}
                                        </div>
                                        <div className="user-card-info">
                                            내선: {user.extension || '-'} | 소속: {companies.find(c => c.id === user.company_id)?.name || '알 수 없음'}
                                        </div>
                                    </div>
                                    <div className="user-card-actions">
                                        {canViewPermission && (
                                            <button
                                                onClick={() => openPermModal(user)}
                                                className="user-card-perm-btn"
                                            >
                                                🔑 권한
                                            </button>
                                        )}
                                        {canUpdateUser && (
                                            <button
                                                onClick={() => openModal(user)}
                                                disabled={saving}
                                                className="user-card-edit-btn"
                                            >
                                                ✏️ 수정
                                            </button>
                                        )}
                                        {canDeleteUser && (
                                            user.is_active === false ? (
                                                <button
                                                    onClick={() => handleRestoreClick(user)}
                                                    disabled={restoringId === user.id}
                                                    className="user-card-restore-btn"
                                                >
                                                    {restoringId === user.id ? '♻️ 복구 중...' : '♻️ 재활성화'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    disabled={deletingId === user.id}
                                                    className="user-card-delete-btn"
                                                >
                                                    {deletingId === user.id ? '🗑️ 삭제 중...' : '🗑️ 삭제'}
                                                </button>
                                            )
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
                                        <th>이름</th>
                                        <th>계정</th>
                                        <th>내선</th>
                                        <th>권한</th>
                                        <th>상태</th>
                                        <th>소속</th>
                                        <th className="center">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((user: any) => (
                                        <tr key={user.id}>
                                            <td className="name">{user.name}</td>
                                            <td>@{user.username}</td>
                                            <td>{user.extension || '-'}</td>
                                            <td>
                                                <span
                                                    className="user-table-role-badge"
                                                    style={{ background: getRoleBadgeColor(user.role) }}
                                                >
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`user-table-status-badge ${user.is_active === false ? 'inactive' : 'active'}`}>
                                                    {user.is_active === false ? '비활성' : '활성'}
                                                </span>
                                            </td>
                                            <td>{companies.find(c => c.id === user.company_id)?.name || '-'}</td>
                                            <td className="center">
                                                <div className="user-table-actions">
                                                    {canViewPermission && (
                                                        <button
                                                            onClick={() => openPermModal(user)}
                                                            className="user-table-perm-btn"
                                                            title="권한 설정"
                                                        >
                                                            🔑
                                                        </button>
                                                    )}
                                                    {canUpdateUser && (
                                                        <button
                                                        onClick={() => openModal(user)}
                                                        className="user-table-edit-btn"
                                                    >
                                                        ✏️
                                                    </button>
                                                    )}
                                                    {canDeleteUser && (
                                                        user.is_active === false ? (
                                                            <button
                                                                onClick={() => handleRestoreClick(user)}
                                                                disabled={restoringId === user.id}
                                                                className="user-table-restore-btn"
                                                                title="재활성화"
                                                            >
                                                                ♻️
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteClick(user)}
                                                                disabled={deletingId === user.id}
                                                                className="user-table-delete-btn"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )
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

                {/* 페이지네이션 */}
                {!loading && filteredAndSortedUsers.length > 0 && (
                    <div className="user-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="user-pagination-btn"
                        >
                            ← 이전
                        </button>

                        <div className="user-pagination-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (totalPages <= 7) return true;
                                    if (page === 1 || page === totalPages) return true;
                                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                    return false;
                                })
                                .map((page, idx, arr) => {
                                    if (idx > 0 && page - arr[idx - 1] > 1) {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="user-pagination-ellipsis">...</span>
                                        );
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`user-pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="user-pagination-btn"
                        >
                            다음 →
                        </button>
                    </div>
                )}
            </section>

            {/* 중앙 모달 (생성/수정 폼) */}
            {isModalOpen && (
                <div className="user-modal-overlay">
                    <div className="user-modal-content">
                        <div className="user-modal-header">
                            <h3 className="user-modal-title">
                                {isEditMode ? '✏️ 상담원 정보 수정' : '➕ 신규 상담원 등록'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="user-modal-close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="user-modal-body">
                            <div className="user-form-group">
                                <label className="user-form-label">
                                    소속 업체 <span className="user-form-label-required">*</span>
                                </label>
                                <select
                                    value={formData.company_id || ""}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setFormData({...formData, company_id: value ? Number(value) : null});
                                    }}
                                    disabled={isEditMode || (isEditMode ? !canUpdateUser : !canCreateUser)}
                                    className="user-form-input"
                                >
                                    <option value="">선택하세요</option>
                                    {companies.map((comp) => (
                                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    계정 ID <span className="user-form-label-required">*</span>
                                </label>
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    placeholder="로그인 아이디 (영문/숫자)"
                                    disabled={isEditMode ? !canUpdateUser : !canCreateUser}
                                    className="user-form-input"
                                />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    비밀번호 {isEditMode ? '(변경 시에만 입력)' : <span className="user-form-label-required">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="비밀번호 입력"
                                    disabled={isEditMode ? !canUpdateUser : !canCreateUser}
                                    className="user-form-input"
                                />
                                <p className="user-form-helper-text">
                                    최소 8자 이상, 영문자 1개 이상, 숫자 1개 이상 포함
                                </p>
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    이름 <span className="user-form-label-required">*</span>
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="상담원 실명"
                                    disabled={isEditMode ? !canUpdateUser : !canCreateUser}
                                    className="user-form-input"
                                />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">내선 번호</label>
                                <input
                                    value={formData.extension}
                                    onChange={e => setFormData({...formData, extension: e.target.value})}
                                    placeholder="예: 201"
                                    disabled={isEditMode ? !canUpdateUser : !canCreateUser}
                                    className="user-form-input"
                                />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">권한(Role)</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    disabled={isEditMode ? !canUpdateUser : !canCreateUser}
                                    className="user-form-input"
                                >
                                    <option value="AGENT">상담원 (AGENT)</option>
                                    <option value="MANAGER">매니저 (MANAGER)</option>
                                    <option value="SYSTEM_ADMIN">시스템 관리자 (ADMIN)</option>
                                </select>
                            </div>
                        </div>

                        <div className="user-modal-footer">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={saving}
                                className="user-modal-cancel-btn"
                            >
                                취소
                            </button>
                            {(isEditMode ? canUpdateUser : canCreateUser) && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="user-modal-save-btn"
                                >
                                    {saving ? '저장 중...' : (isEditMode ? '✓ 수정 완료' : '✓ 상담원 등록')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 권한 설정 모달 */}
            {isPermModalOpen && (
                <div className="user-modal-overlay">
                    <div className="user-modal-content user-perm-modal">
                        <div className="user-modal-header">
                            <h3 className="user-modal-title">
                                🔑 '{permTargetUser?.name}' 권한 설정
                            </h3>
                            <button onClick={() => setIsPermModalOpen(false)} className="user-modal-close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="user-modal-body">
                            {permLoading? (
                                <div className="user-perm-loading">권한 정보 로딩 중...</div>
                            ) : permTemplates.filter(m => m.is_active).length === 0 ? (
                                <div className="user-perm-empty">등록된 권한 템플릿이 없습니다.</div>
                            ) : (
                                <div className="user-perm-list">
                                    {permTemplates
                                        .filter((menu: any) => menu.is_active)
                                        .map((menu: any) => (
                                            <div key={menu.id} className="user-perm-menu-group">
                                                <div className="user-perm-menu-header">
                                                    <label className="user-perm-menu-toggle">
                                                        <input 
                                                            type="checkbox"
                                                            checked={permChecked.has(menu.id)}
                                                            onChange={() => handleMenuToggle(menu.id)}
                                                            disabled={!canUpsertPermission}
                                                            className="user-perm-checkbox"
                                                        />
                                                        <span className="user-perm-menu-name">{menu.name}</span>
                                                    </label>
                                                    <span className="user-perm-menu-code">{menu.code}</span>
                                                </div>
                                                <div className="user-perm-actions">
                                                    {(menu.children || [])
                                                        .filter((action: any) => action.is_active)
                                                        .map((action: any) => (
                                                            <label key={action.id} className="user-perm-action-item">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={permChecked.has(action.id)}
                                                                    onChange={() => handlePermToggle(action.id)}
                                                                    className="user-perm-checkbox"
                                                                    disabled={!canUpsertPermission || !permChecked.has(menu.id)}
                                                                />
                                                                <span className={`user-perm-action-name ${!permChecked.has(menu.id) ? 'disabled' : ''}`}>
                                                                    {action.name}
                                                                </span>
                                                                <span className="user-perm-action-code">{action.code}</span>
                                                            </label>
                                                        ))}
                                                    {(menu.children || []).filter((a: any) => a.is_active).length === 0 && (
                                                        <p className="user-perm-no-actions">등록된 액션이 없습니다.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="user-modal-footer">
                            <button
                                onClick={() => setIsPermModalOpen(false)}
                                disabled={permSaving}
                                className="user-modal-cancel-btn"
                            >
                                취소
                            </button>
                            {canUpsertPermission && (
                                <button
                                    onClick={handlePermSave}
                                    disabled={permSaving || permLoading}
                                    className="user-modal-save-btn"
                                >
                                    {permSaving ? '저장 중...' : '✓ 권한 저장'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
}
