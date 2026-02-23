"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, ClipboardList, PhoneOutgoing, Phone, Coffee, BookOpen, PowerOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "@/styles/ui/StatusDropdown.module.css";

export const activityMap: Record<string, { label: string; icon: LucideIcon }> = {
    READY:           { label: "대기중",      icon: CheckCircle2 },
    POST_PROCESSING: { label: "후처리",      icon: ClipboardList },
    CALLING:         { label: "통화 연결중",  icon: PhoneOutgoing },
    ON_CALL:         { label: "통화중",      icon: Phone },
    AWAY:            { label: "이석",        icon: Coffee },
    TRAINING:        { label: "교육",        icon: BookOpen },
    DISABLED:        { label: "비활성화",    icon: PowerOff },
};

const statusColors: Record<string, { color: string; bg: string }> = {
    READY:           { color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" },
    POST_PROCESSING: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
    CALLING:         { color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)" },
    ON_CALL:         { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
    AWAY:            { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
    TRAINING:        { color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)" },
    DISABLED:        { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.08)" },
};

interface StatusDropdownProps {
    currentActivity: string;
    onActivityChange: (newActivity: string) => void;
}

export default function StatusDropdown({ currentActivity, onActivityChange }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
    const CurrentIcon = activityMap[currentActivity]?.icon;

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <div
                className={styles.selectedWrapper}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    borderColor: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                }}
            >
                {CurrentIcon && (
                    <CurrentIcon size={15} strokeWidth={2.5} />
                )}
                <span className={styles.selectedLabel}>
                    {activityMap[currentActivity]?.label ?? currentActivity}
                </span>
                <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>▼</span>
            </div>

            {isOpen && (
                <ul className={styles.dropdownList}>
                    {Object.keys(activityMap)
                        .filter(key => !["DISABLED", "CALLING", "ON_CALL"].includes(key))
                        .map((key) => {
                            const isActive = currentActivity === key;
                            const itemColor = statusColors[key]?.color;
                            const ItemIcon = activityMap[key].icon;
                            return (
                                <li
                                    key={key}
                                    className={`${styles.dropdownItem} ${isActive ? styles.active : ""}`}
                                    onClick={() => handleSelect(key)}
                                    style={{ color: itemColor, ...(isActive ? { backgroundColor: statusColors[key]?.bg } : {}) }}
                                >
                                    <ItemIcon size={14} strokeWidth={2.5} />
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
