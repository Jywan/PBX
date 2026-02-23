"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/styles/ui/StatusDropdown.module.css";

export const activityMap: Record<string, { label: string }> = {
    READY: { label: "대기중" },
    POST_PROCESSING: { label: "후처리" },
    CALLING: { label: "통화 연결중" },
    ON_CALL: { label: "통화중" },
    AWAY: { label: "이석" },
    TRAINING: { label: "교육" },
    DISABLED: { label: "비활성화" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
    READY: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" },
    POST_PROCESSING: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
    CALLING: { color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)" },
    ON_CALL: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
    AWAY: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
    TRAINING: { color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)" },
    DISABLED: { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.08)" },
};

interface StatusDropdownProps {
    currentActivity: string;
    onActivityChange: (newActivity: string) => void;
}

export default function StatusDropdown({ currentActivity, onActivityChange }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 드롭다운 바깥 클릭 시 닫기 로직
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (key: string) => {
        onActivityChange(key);
        setIsOpen(false);
    };

    const statusStyle = statusColors[currentActivity] || statusColors.DISABLED;

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <div
                className={styles.selectedWrapper}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    borderColor: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                }}
            >
                <span className={`${styles.dot} ${styles[currentActivity]}`} />
                <span className={styles.selectedLabel} style={{ color: statusStyle.color }}>
                    {activityMap[currentActivity]?.label ?? currentActivity}
                </span>
                <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>▼</span>
            </div>

            {/* 드롭다운 목록 */}
            {isOpen && (
                <ul className={styles.dropdownList}>
                    {Object.keys(activityMap)
                        .filter(key => !["DISABLED", "CALLING", "ON_CALL"].includes(key))
                        .map((key) => {
                            const isActive = currentActivity === key;
                            const itemColor = statusColors[key]?.color;
                            return (
                                <li
                                    key={key}
                                    className={`${styles.dropdownItem} ${isActive ? styles.active : ""}`}
                                    onClick={() => handleSelect(key)}
                                    style={isActive ? { backgroundColor: statusColors[key]?.bg, color: itemColor } : undefined}
                                >
                                    <span className={`${styles.dot} ${styles[key]}`} />
                                    {activityMap[key].label}
                                    {isActive && (
                                        <span className={styles.checkmark} style={{ color: itemColor }}>✓</span>
                                    )}
                                </li>
                            );
                        })}
                </ul>
            )}
        </div>
    );
}
