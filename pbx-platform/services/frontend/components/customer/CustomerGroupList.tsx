"use client";

import { Users } from "lucide-react";
import type { CustomerGroup } from "@/types/customer";

interface CustomerGroupListProps {
    groups: CustomerGroup[];
    groupCounts: Record<string, number>;
    selectedGroup: string;
    onSelectGroup: (id: string) => void;
}

export default function CustomerGroupList({ groups, groupCounts, selectedGroup, onSelectGroup }: CustomerGroupListProps) {
    return (
        <section className="customer-col customer-col-groups">
            <h3 className="customer-title">
                <Users size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                그룹
            </h3>
            <ul className="group-list">
                {groups.map(g => (
                    <li
                        key={g.id}
                        className={`group-item ${selectedGroup === g.id ? "active" : ""}`}
                        onClick={() => onSelectGroup(g.id)}
                    >
                        <span className="group-dot" style={{ background: g.color }} />
                        <span className="group-label">{g.label}</span>
                        <span className="group-count">{groupCounts[g.id] ?? 0}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
