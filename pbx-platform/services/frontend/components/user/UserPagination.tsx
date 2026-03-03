"use client";

interface UserPaginationProps {
    loading: boolean;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function UserPagination({
    loading, totalCount, currentPage, totalPages, onPageChange,
}: UserPaginationProps) {
    if (loading || totalCount === 0) return null;

    return (
        <div className="user-pagination">
            <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="user-pagination-btn">← 이전</button>
            <div className="user-pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                    .map((page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) return <span key={`ellipsis-${idx}`} className="user-pagination-ellipsis">...</span>;
                        return <button key={page} onClick={() => onPageChange(page)} className={`user-pagination-page-btn ${currentPage === page ? 'active' : ''}`}>{page}</button>;
                    })}
            </div>
            <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="user-pagination-btn">다음 →</button>
        </div>
    );
}
