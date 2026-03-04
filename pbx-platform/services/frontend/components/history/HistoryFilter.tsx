"use client";

import { Search, RotateCcw } from "lucide-react";
import type { FilterState } from "@/hooks/useHistoryData";

interface HistoryFilterProps {
    filter: FilterState;
    onFilterChange: (filter: FilterState) => void;
    onApply: () => void;
    onReset: () => void;
}

export default function HistoryFilter({ filter, onFilterChange, onApply, onReset }: HistoryFilterProps) {
    const set = (partial: Partial<FilterState>) => onFilterChange({ ...filter, ...partial });

    return (
        <section className="history-col history-col-filter">
            <h3 className="history-section-title">조회 조건</h3>

            <div className="filter-group">
                <label className="filter-label">기간</label>
                <input type="date" className="filter-input"
                    value={filter.dateFrom}
                    onChange={e => set({ dateFrom: e.target.value })}
                />
                <span className="filter-range-sep">~</span>
                <input type="date" className="filter-input"
                    value={filter.dateTo}
                    onChange={e => set({ dateTo: e.target.value })}
                />
            </div>

            <div className="filter-group">
                <label className="filter-label">방향</label>
                <select className="filter-select"
                    value={filter.direction}
                    onChange={e => set({ direction: e.target.value })}
                >
                    <option value="">전체</option>
                    <option value="internal">내선</option>
                    <option value="inbound">인바운드</option>
                    <option value="outbound">아웃바운드</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">상태</label>
                <select className="filter-select"
                    value={filter.status}
                    onChange={e => set({ status: e.target.value })}
                >
                    <option value="">전체</option>
                    <option value="ended">종료</option>
                    <option value="up">통화중</option>
                    <option value="new">대기</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">번호 검색</label>
                <div className="filter-search-wrap">
                    <Search size={13} className="filter-search-icon" />
                    <input
                        type="text"
                        className="filter-input filter-search-input"
                        placeholder="내선번호 입력"
                        value={filter.search}
                        onChange={e => set({ search: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") onApply(); }}
                    />
                </div>
            </div>

            <div className="filter-actions">
                <button className="btn-filter-apply" onClick={onApply}>조회</button>
                <button className="btn-filter-reset" onClick={onReset}>
                    <RotateCcw />초기화
                </button>
            </div>
        </section>
    );
}
