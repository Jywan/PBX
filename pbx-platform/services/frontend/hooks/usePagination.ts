import { useState, useEffect } from "react";

export function usePagination<T>(items: T[], defaultPageSize = 10) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // 데이터 변경시 1페이지로 리셋
    useEffect(() => { setPage(1); }, [items.length]);

    const totalPages = Math.max(1, Math.ceil((items.length / pageSize)));
    const paged = items.slice((page -1) * pageSize, page * pageSize);

    return { page, setPage, pageSize, setPageSize,totalPages, paged };
}