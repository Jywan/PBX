"use client";

import type { Company } from "@/types/company";
import { formatRelativeTime } from "@/lib/utils/date";

interface CompanyListProps {
    companies: Company[];
    filteredCompanies: Company[];
    selectedId: number | null;
    loading: boolean;
    canViewCompanies: boolean;
    canCreateCompany: boolean;
    searchTerm: string;
    filterStatus: "all" | "active" | "inactive";
    sortBy: "latest" | "oldest" | "name";
    onSearchChange: (v: string) => void;
    onFilterChange: (v: "all" | "active" | "inactive") => void;
    onSortChange: (v: "latest" | "oldest" | "name") => void;
    onSelectCompany: (comp: Company) => void;
    onCreateNew: () => void;
}

export default function CompanyList({
    companies, filteredCompanies, selectedId, loading, canViewCompanies, canCreateCompany,
    searchTerm, filterStatus, sortBy, onSearchChange, onFilterChange, onSortChange, onSelectCompany, onCreateNew
}: CompanyListProps) {
    return (
        <section className="company-col company-col-list">
            <div className="company-list-header">
                <h3 className="company-title" style={{ margin: 0 }}>업체 목록</h3>
                {canCreateCompany &&
                    (<button onClick={onCreateNew} className="company-add-btn">+ 신규</button>
                )}
            </div>

            <div className="company-search-filter-container">
                <input 
                    type="text"
                    placeholder="업체명 또는 대표자명으로 검색"
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    className="company-search-input"
                />
                <div className="company-filter-sort-container">
                    <div className="company-filter-buttons">
                        {(["all", "active", "inactive"] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => onFilterChange(status)}
                                className={`company-filter-btn ${filterStatus === status ? 'active' : ''}`}
                            >
                                {status === "all" ? "전체" : status === "active" ? "활성" : "비활성"}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => onSortChange(e.target.value as "latest" | "oldest" | "name")}
                        className="company-sort-select"
                    >
                        <option value="latest">최신순</option>
                        <option value="oldest">오래된순</option>
                        <option value="name">이름순</option>
                    </select>
                </div>
            </div>

            <div className="company-list-container">
                {!canViewCompanies && (
                    <div className="company-empty-state">
                        <div className="company-empty-icon">🔒</div>
                        <div className="company-empty-title">조회 권한이 없습니다</div>
                        <div className="company-empty-description">
                            업체 목록을 조회할 권한이 없습니다. 관리자에게 문의하세요.
                        </div>
                    </div>
                )}

                {canViewCompanies && loading && (
                    <div className="company-loading">로딩 중...</div>
                )}

                {canViewCompanies && !loading && searchTerm && filteredCompanies.length === 0 && (
                    <div className="company-no-results">검색 결과가 없습니다.</div>
                )}

                {canViewCompanies && !loading && !searchTerm && companies.length === 0 && (
                    <div className="company-empty-state">
                        <div className="company-empty-icon">📋</div>
                        <div className="company-empty-title">등록된 업체가 없습니다</div>
                        <div className="company-empty-description">
                            첫 번째 업체를 등록하고<br />PBX 시스템을 시작해보세요.
                        </div>
                        {canCreateCompany && (
                            <button onClick={onCreateNew} className="company-empty-action">
                                첫 업체 등록하기
                            </button>
                        )}
                    </div>
                )}

                {canViewCompanies && !loading && !searchTerm && companies.length > 0 && filteredCompanies.length === 0 && (
                    <div className="company-no-results">해당 상태의 업체가 없습니다.</div>
                )}

                {canViewCompanies && filteredCompanies.map(comp => (
                    <div
                        key={comp.id}
                        onClick={() => onSelectCompany(comp)}
                        className={`company-card ${selectedId === comp.id ? "selected" : ""}`}
                    >
                        <div className="company-card-header">
                            <div className="company-card-title">
                                {comp.name}
                                {comp.callback && (
                                    <span className="company-callback-icon" title="콜백 활성화">C</span>
                                )}
                            </div>
                            <span className={`company-status-badge ${comp.active ? "active" : "inactive"}`}>
                                {comp.active ? "활성" : "비활성"}
                            </span>
                        </div>
                        <div className="company-card-body">
                            <span>{comp.businessNumber || ""}</span>
                            <span className="company-registered-date">
                                {formatRelativeTime(comp.registered_at)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}