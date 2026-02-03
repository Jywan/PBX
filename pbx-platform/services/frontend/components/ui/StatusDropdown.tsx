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

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <div className={styles.selectedWrapper} onClick={() => setIsOpen(!isOpen)}>
                <span className={`${styles.dot} ${styles[currentActivity]}`} />
                <span className={styles.selectedLabel}>{activityMap[currentActivity].label}</span>
                <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>▼</span>
            </div>

            {/* 드롭다운 목록 */}
            {isOpen && (
                <ul className={styles.dropdownList}>
                    {Object.keys(activityMap)
                        .filter(key => key !== "DISABLED") 
                        .map((key) => (
                            <li 
                                key={key} 
                                className={`${styles.dropdownItem} ${currentActivity === key ? styles.active : ""}`}
                                onClick={() => handleSelect(key)}
                            >
                                <span className={`${styles.dot} ${styles[key]}`} />
                                {activityMap[key].label}
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
}