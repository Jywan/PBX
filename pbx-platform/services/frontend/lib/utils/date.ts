/**
 * 날짜/시간 포맷팅 유틸리티
 */

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 상대적 시간 표시 (예: "2일 전", "1개월 전")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
}

/**
 * 날짜만 포맷 (예: "2026.02.12"), null 처리 포함
 */
export function formatDateOnly(dt: string | null): string {
    if (!dt) return '-';
    const d = new Date(dt);
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/**
 * 시간만 포맷 (예: "10:30:00"), null 처리 포함
 */
export function formatTimeOnly(dt: string | null): string {
    if (!dt) return '-';
    const d = new Date(dt);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 날짜+시간 포맷 (예: "2026.02.12 10:30:00"), null 처리 포함
 */
export function formatDateTime(dt: string | null): string {
    if (!dt) return '-';
    const d = new Date(dt);
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 초(sec) → "X분 Y초" 포맷 (예: "5분 23초", "45초")
 */
export function formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

/**
 * 두 타임스탬프 간 통화 시간 계산 → "X분 Y초" (예: "5분 23초")
 */
export function calcDuration(answeredAt: string | null, endedAt: string | null): string {
    if (!answeredAt || !endedAt) return '-';
    const sec = Math.floor((new Date(endedAt).getTime() - new Date(answeredAt).getTime()) / 1000);
    if (sec < 0) return '-';
    return formatSeconds(sec);
}

/**
 * 콜 타이머 포맷 (예: "05:23", "01:05:23")
 */
export function formatTimer(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
