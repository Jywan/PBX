"use client";

import { useState, useEffect, use } from "react";
import type { Queue, QueueStrategy, QueueUpdate } from "@/types/queue";

const STRATEGIES: { value : QueueStrategy; label: string }[] = [
    { value: "ringall",     label: "동시 울림 (ringall)" },
    { value: "rrmemory",    label: "라운드로빈 (rrmemory)" },
    { value: "leastrecent", label: "최장 대기 (leastrecent)" },
    { value: "fewestcalls", label: "최소 통화 (fewestcalls)" },
    { value: "wrandom",     label: "가중 랜덤 (wrandom)" },
    { value: "linear",      label: "순서대로 (linear)" },
];

interface Props {
    queue: Queue;
    onSave: (queueId: number, data: QueueUpdate) => void;
    canUpdate: boolean;
}

export default function QueueEditor({ queue, onSave, canUpdate }: Props) {
    const [name, setName] = useState(queue.name);
    const [strategy, setStrategy] = useState<QueueStrategy>(queue.strategy);
    const [timeout, setTimeoutVal] = useState(queue.timeout);
    const [wrapuptime, setWrapuptime] = useState(queue.wrapuptime);
    const [maxlen, setMaxlen] = useState(queue.maxlen);
    const [moh, setMoh] = useState(queue.music_on_hole);

    useEffect(() => {
        setName(queue.name);
        setStrategy(queue.strategy);
        setTimeoutVal(queue.timeout);
        setWrapuptime(queue.wrapuptime);
        setMaxlen(queue.maxlen);
        setMoh(queue.music_on_hole);
    }, [queue]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(queue.id, {
            name: name.trim(),
            strategy,
            timeout,
            wrapuptime,
            maxlen,
            music_on_hold: moh,
        });
    };

    return (
        <div className="queue-editor">
            <div className="queue-editor-title">큐 설정</div>

            <div className="queue-field-group">
                <label className="queue-field-label">큐 이름</label>
                <input
                    className="queue-field-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!canUpdate}
                />
            </div>

            <div className="queue-field-group">
                <label className="queue-field-label">분배 전략</label>
                <select 
                    className="queue-field-select"
                    value={strategy}
                    onChange={e => setStrategy(e.target.value as QueueStrategy)}
                    disabled={!canUpdate}
                >
                    {STRATEGIES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            <div className="queue-field-row">
                <div className="queue-field-group">
                    <label className="queue-field-label">응답 대기 (초)</label>
                    <input
                        className="queue-field-input"
                        type="number"
                        min={1}
                        value={timeout}
                        onChange={e => setTimeoutVal(Number(e.target.value))}
                        disabled={!canUpdate}
                    />
                </div>
                <div className="queue-field-group">
                    <label className="queue-field-label">후처리 시간 (초)</label>
                    <input
                        className="queue-field-input"
                        type="number"
                        min={0}
                        value={wrapuptime}
                        onChange={e => setWrapuptime(Number(e.target.value))}
                        disabled={!canUpdate}
                    />
                </div>
            </div>

            <div className="queue-field-row">
                <div className="queue-field-group">
                    <label className="queue-field-label">최대 대기 인원 (0=무제한)</label>
                    <input
                        className="queue-field-input"
                        type="number"
                        min={0}
                        value={maxlen}
                        onChange={e => setMaxlen(Number(e.target.value))}
                        disabled={!canUpdate}
                    />
                </div>
                <div className="queue-field-group">
                    <label className="queue-field-label">대기 음악 (MOH)</label>
                    <input
                        className="queue-field-input"
                        value={moh}
                        onChange={e => setMoh(e.target.value)}
                        placeholder="default"
                        disabled={!canUpdate}
                    />
                </div>
            </div>

            {canUpdate && (
                <div className="queue-editor-footer">
                    <button className="btn-queue-save" onClick={handleSave}>저장</button>
                </div>
            )}
        </div>
    );
}