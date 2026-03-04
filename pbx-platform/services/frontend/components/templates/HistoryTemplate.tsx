"use client";

import { useHistoryData } from "@/hooks/useHistoryData";
import "@/styles/templates/history.css";
import HistoryFilter from "@/components/history/HistoryFilter";
import HistoryList from "@/components/history/HistoryList";
import HistoryDetail from "@/components/history/HistoryDetail";

export default function HistoryTemplate() {
    const {
        filtered, selectedCall, loading, error,
        filter, setFilter,
        selectedId, setSelectedId,
        handleApply, handleReset,
        directionLabel, statusLabel, statusClass, directionClass,
    } = useHistoryData();

    return (
        <div className="history-container">
            <HistoryFilter
                filter={filter}
                onFilterChange={setFilter}
                onApply={handleApply}
                onReset={handleReset}
            />
            <HistoryList
                loading={loading}
                error={error}
                filtered={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                directionLabel={directionLabel}
                directionClass={directionClass}
                statusLabel={statusLabel}
                statusClass={statusClass}
            />
            <HistoryDetail
                selectedCall={selectedCall}
                directionLabel={directionLabel}
                directionClass={directionClass}
                statusLabel={statusLabel}
                statusClass={statusClass}
            />
        </div>
    );
}
