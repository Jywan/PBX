"use client";

import styles from "@/styles/components/Pagination.module.css";

interface Props {
    page: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export default function Pagination({
    page, totalPages, pageSize,
    onPageChange, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50],
}: Props) {
    return (
        <div className={styles.wrap}>
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className={styles.pageBtn}
            >← 이전</button>

            <div className={styles.pages}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p =>
                        totalPages <= 7 ||
                        p === 1 ||
                        p === totalPages ||
                        (p >= page - 1 && p <= page + 1)
                    )
                    .map((p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1)
                            return <span key={`ellipsis-${idx}`} className={styles.ellipsis}>...</span>;
                        return (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`${styles.pageNumBtn} ${page === p ? styles.active : ""}`}
                            >{p}</button>
                        );
                    })}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={styles.pageBtn}
            >다음 →</button>

            <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className={styles.sizeSelect}
            >
                {pageSizeOptions.map(s => <option key={s} value={s}>{s}개씩</option>)}
            </select>
        </div>
    );
}
