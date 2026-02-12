"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import "@/styles/templates/user.css";
import "@/styles/common/toast.css";
import { SuccessIcon, ErrorIcon } from "@/components/common/Icons";

import { useAuth } from "@/hooks/useAuth";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchUsers, createUser, updateUser, deleteUser, restoreUser } from "@/lib/api/users";
import type { User } from "@/types/user";

// 공통 모달 & 훅 import
import ConfirmModal from "@/components/common/ConfirmModal";
import { useConfirmModal } from "@/hooks/useConfirmModal";

type ViewMode = "card" | "table";
type SortField = "name" | "created_at" | "role" | "username";
type SortOrder = "asc" | "desc";

export default function UserTemplate() {
    const router = useRouter();

    // --- Auth & Data State ---
    const { token, isSystemAdmin, companyId, isLoading: authLoading } = useAuth();
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

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null; isExiting: boolean }>({
        message: "", type: null, isExiting: false
    });

    // --- Helpers ---
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type, isExiting: false });
        setTimeout(() => setToast(prev => ({ ...prev, isExiting: true })), 2600);
        setTimeout(() => setToast({ message: "", type: null, isExiting: false }), 3000);
    };

    // --- Effects ---
    useEffect(() => {
        if (token && !authLoading) {
            fetchInitialData();
        }
    }, [token, authLoading, selectedCompanyId]);

    // --- API Handlers ---
    const fetchInitialData = async () => {
        if (!token) return;

        setLoading(true);
        try {
            if (isSystemAdmin) {
                const companiesList = await fetchCompanies(token);
                setCompanies(companiesList);

                // 시스템 관리자는 업체를 선택해야 사용자 목록 조회
                if (!selectedCompanyId) {
                    setUsers([]);
                    setLoading(false);
                    return;
                }
            }

            const usersList = await fetchUsers(
                token,
                isSystemAdmin && selectedCompanyId ? selectedCompanyId : undefined
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
                // 시스템 관리자는 현재 선택된 업체로 동기화
                company_id: isSystemAdmin ? selectedCompanyId : (companies.length > 0 ? companies[0].id : null)
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

    return (
        <div className="user-container">
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
                        <button onClick={() => openModal()} className="user-add-btn">
                            + 신규 등록
                        </button>
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
                    {/* 로딩 */}
                    {loading && (
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
                    {!loading && filteredAndSortedUsers.length === 0 && (
                        <div className="user-empty-state">
                            <div className="user-empty-icon">👤</div>
                            <h3 className="user-empty-title">사용자가 없습니다</h3>
                            <p className="user-empty-description">
                                조건에 맞는 사용자가 없습니다. 새로운 사용자를 등록해보세요.
                            </p>
                            <button onClick={() => openModal()} className="user-empty-action">
                                + 신규 사용자 등록
                            </button>
                        </div>
                    )}

                    {/* 카드 뷰 */}
                    {!loading && viewMode === "card" && paginatedUsers.length > 0 && (
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
                                        <button
                                            onClick={() => openModal(user)}
                                            disabled={saving}
                                            className="user-card-edit-btn"
                                        >
                                            ✏️ 수정
                                        </button>
                                        {user.is_active === false ? (
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
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 테이블 뷰 */}
                    {!loading && viewMode === "table" && paginatedUsers.length > 0 && (
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
                                                    <button
                                                        onClick={() => openModal(user)}
                                                        className="user-table-edit-btn"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {user.is_active === false ? (
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
                                    disabled={isEditMode}
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
                                    className="user-form-input"
                                />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">내선 번호</label>
                                <input
                                    value={formData.extension}
                                    onChange={e => setFormData({...formData, extension: e.target.value})}
                                    placeholder="예: 201"
                                    className="user-form-input"
                                />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">권한(Role)</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
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
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="user-modal-save-btn"
                            >
                                {saving ? '저장 중...' : (isEditMode ? '✓ 수정 완료' : '✓ 상담원 등록')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
