"use client";

import { useState, useEffect, useRef } from "react";
import type { IvrNode, IvrNodeType, IvrNodeCreate, IvrNodeUpdate } from "@/types/ivr";
import type { Queue } from "@/types/queue";
import type { User } from "@/types/user";

import styles from "@/styles/components/QueueUserSelect.module.css";

const NODE_TYPES: { value: IvrNodeType; label: string }[] = [
    { value: "greeting", label: "안내멘트" },
    { value: "menu", label: "메뉴선택" },
    { value: "transfer", label: "내선연결" },
    { value: "hangup", label: "종료" },
    { value: "voicemail", label: "음성메시지" },
];

const DTMF_KEYS = ["1","2","3","4","5","6","7","8","9","0","*","#"];

interface AddMode {
    mode: "add",
    flowId: number;
    parentNode: IvrNode | null;
}
interface EditMode {
    mode: "edit"
    node: IvrNode;
}

type EditorMode = AddMode | EditMode;

interface Props {
    editorMode: EditorMode | null;
    queues: Queue[];
    onSaveAdd: (data: IvrNodeCreate) => void;
    onSaveEdit: (nodeId: number, data: IvrNodeUpdate) => void;
    onDelete: (nodeId: number) => void;
    onClose: () => void;
    canUpdate: boolean;
    canDelete: boolean;
    onUploadSound: (nodeId: number, formData: FormData) => Promise<void>;
    onDeleteSound: (nodeId: number) => Promise<void>;
    users: User[];
}

export default function IvrNodeEditor({
    editorMode, queues, onSaveAdd, onSaveEdit, onDelete, onClose,
    canUpdate, canDelete, onUploadSound, onDeleteSound, users
}: Props) {
    const [nodeType, setNodeType] = useState<IvrNodeType>("greeting");
    const [name, setName] = useState("");
    const [dtmfKey, setDtmfKey] = useState("");
    const [message, setMessage] = useState("");
    const [prompt, setPrompt] = useState("");
    const [timeout, setTimeoutVal] = useState(5);
    const [targetExten, setTargetExten] = useState("");
    const [mailbox, setMailbox] = useState("");
    const [transferMode, setTransferMode] = useState<"exten" | "queue">("exten")
    const [queueId, setQueueId] = useState<number | null>(null); 
    const [soundUploading, setSoundUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editorMode) return;
        if (editorMode.mode === "edit") {
            const n = editorMode.node;
            setNodeType(n.node_type);
            setName(n.name);
            setDtmfKey(n.dtmf_key ?? "");
            setMessage(n.config.message ?? "");
            setPrompt(n.config.prompt ?? "");
            setTimeoutVal(n.config.timeout ?? 5);
            setTargetExten(n.config.target_exten ?? "");
            setMailbox(n.config.mailbox ?? "");
            if (n.queue_id) {
                setTransferMode("queue");
                setQueueId(n.queue_id);
            } else {
                setTransferMode("exten");
                setQueueId(null);
            }
            const matched = users.find(u => u.extension === n.config.target_exten);
            setSelectedUserId(matched ? matched.id : "");
        } else {
            setNodeType("greeting");
            setName("");
            setDtmfKey("");
            setMessage("");
            setPrompt("");
            setTimeoutVal(5);
            setTargetExten("");
            setMailbox("");
            setTransferMode("exten");
            setQueueId(null);
            setSelectedUserId("");
            setDropdownOpen(false);
        }
    }, [editorMode, users]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!editorMode) {
        return (
            <div className="ivr-editor-empty">
                <span>노드를 선택하거나 추가 버튼을 누르세요</span>
            </div>
        );
    }

    const handleUserSelect = (userId: number | "") => {
        setSelectedUserId(userId);
        setDropdownOpen(false);
        if (userId === "") {
            setTargetExten("");
            return;
        }
        const user = users.find(u => u.id === userId);
        if (user?.extension) setTargetExten(user.extension);
    };

    const roleLabel = (role: string) => {
        switch (role) {
            case "SYSTEM_ADMIN": return { label: "시스템 관리자", cls: styles.roleAdmin };
            case "MANAGER":      return { label: "업체 관리자",   cls: styles.roleManager };
            case "AGENT":        return { label: "상담원",        cls: styles.roleAgent };
            default:             return { label: role,            cls: styles.badgeGray };
        }
    };

    const buildConfig = () => {
        if (nodeType === "greeting") return { message };
        if (nodeType === "menu") return { prompt, timeout };
        if (nodeType === "transfer") return transferMode === "exten" ? { target_exten: targetExten } : {};
        if (nodeType === "voicemail") return { mailbox };
        return {};
    };

    const handleSave = () => {
        if (!name.trim()) return;

        const resolvedQueueId = nodeType === "transfer" && transferMode === "queue" ? queueId : null;

        if (editorMode.mode === "add") {
            const data: IvrNodeCreate = {
                flow_id: editorMode.flowId,
                parent_id: editorMode.parentNode?.id ?? null,
                node_type: nodeType,
                name: name.trim(),
                dtmf_key: dtmfKey || null,
                config: buildConfig(),
                queue_id: resolvedQueueId,
            };
            onSaveAdd(data);
        } else {
            const data: IvrNodeUpdate = {
                node_type: nodeType,
                name: name.trim(),
                dtmf_key: dtmfKey || null,
                config: buildConfig(),
                queue_id: resolvedQueueId,
            };
            onSaveEdit(editorMode.node.id, data);
        }
    };

    const handleSoundFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editorMode.mode !== "edit") return;
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("name", file.name.replace(/\.[^.]+$/, ""));
        fd.append("file", file);
        setSoundUploading(true);
        try {
            await onUploadSound(editorMode.node.id, fd);
        } finally {
            setSoundUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleSoundDelete = async () => {
        if (editorMode.mode !== "edit") return;
        setSoundUploading(true);
        try {
            await onDeleteSound(editorMode.node.id);
        } finally {
            setSoundUploading(false);
        }
    };

    const isEdit = editorMode.mode === "edit";
    const hasSoundField = nodeType === "greeting" || nodeType === "menu";
    const currentSound = isEdit ? editorMode.node.sound : null;

    const parentLabel = editorMode.mode === "add" && editorMode.parentNode
        ? `상위: ${editorMode.parentNode.name}`
        : editorMode.mode === "add" ? "루트 노드" : null;

    return (
        <div className="ivr-editor-panel">
            <div className="ivr-editor-header">
                <span className="ivr-editor-title">{isEdit ? "노드 수정" : "노드 추가"}</span>
                <button className="btn-ivr-icon" onClick={onClose}>✕</button>
            </div>

            {parentLabel && <div className="ivr-editor-parent-label">{parentLabel}</div>}

            <div className="ivr-editor-fields">
                <label className="ivr-field-label">노드 유형</label>
                <select className="ivr-field-select" value={nodeType} onChange={e => setNodeType(e.target.value as IvrNodeType)}>
                    {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <label className="ivr-field-label">이름</label>
                <input className="ivr-field-input" value={name} onChange={e => setName(e.target.value)} placeholder="노드 이름" />

                <label className="ivr-field-label">DTMF 키</label>
                <select className="ivr-field-select" value={dtmfKey} onChange={e => setDtmfKey(e.target.value)}>
                    <option value="">없음</option>
                    {DTMF_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>

                {hasSoundField && (
                    <>
                        <label className="ivr-field-label">음성 파일</label>
                        {isEdit ? (
                            <div className="ivr-sound-field">
                                {currentSound ? (
                                    <div className="ivr-sound-current">
                                        <div className="ivr-sound-info">
                                            <span className="ivr-sound-name">{currentSound.name}</span>
                                            <span className="ivr-sound-original">{currentSound.original_filename}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <label className="btn-ivr-icon" title="파일 변경" style={{ cursor: soundUploading ? "not-allowed" : "pointer" }}>
                                                📎
                                                <input ref={fileRef} type="file" hidden accept=".wav,.mp3,.gsm" onChange={handleSoundFileChange} disabled={soundUploading} />
                                            </label>
                                            <button className="btn-ivr-icon btn-danger" onClick={handleSoundDelete} disabled={soundUploading}>🗑</button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="ivr-sound-upload-label" style={{ opacity: soundUploading ? 0.5 : 1 }}>
                                        {soundUploading ? "업로드 중..." : "📎 파일 업로드"}
                                        <input ref={fileRef} type="file" hidden accept=".wav,.mp3,.gsm" onChange={handleSoundFileChange} disabled={soundUploading} />
                                    </label>
                                )}
                            </div>
                        ) : (
                            <span className="ivr-empty-hint" style={{ fontSize: "11px" }}>노드 저장 후 업로드 가능</span>
                        )}
                    </>
                )}

                {nodeType === "greeting" && (
                    <>
                        <label className="ivr-field-label">안내 메세지</label>
                        <textarea className="ivr-field-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="재생할 메세지 또는 파일명" />
                    </>
                )}

                {nodeType === "menu" && (
                    <>
                        <label className="ivr-field-label">메뉴 안내</label>
                        <textarea className="ivr-field-textarea" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="메뉴 선택 안내 문구" />
                        <label className="ivr-field-label">타임아웃(초)</label>
                        <input className="ivr-field-input" type="number" min={1} max={30} value={timeout} onChange={e => setTimeoutVal(Number(e.target.value))} />
                    </>
                )}

                {nodeType === "transfer" && (
                    <>
                        <label className="ivr-field-label">연결 유형</label>
                        <div className="ivr-transfer-mode-options">
                            <label className="ivr-transfer-mode-option">
                                <input 
                                    type="radio"
                                    name="transferMode"
                                    value="exten"
                                    checked={transferMode === "exten"}
                                    onChange={() => setTransferMode("exten")} 
                                />
                                내선번호
                            </label>
                            <label className="ivr-transfer-mode-option">
                                <input
                                    type="radio"
                                    name="transferMode"
                                    value="queue"
                                    checked={transferMode === "queue"}
                                    onChange={() => setTransferMode("queue")}
                                />
                                큐 연결
                            </label>
                        </div>
                        {transferMode === "exten" ? (
                            <>
                                <label className="ivr-field-label">연결 상담원</label>
                                <div className={styles.dropdown} ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className={styles.trigger}
                                        onClick={() => setDropdownOpen(v => !v)}
                                    >
                                        {selectedUserId !== "" ? (() => {
                                            const u = users.find(x => x.id === selectedUserId);
                                            return u ? (
                                                <span className={styles.triggerItem}>
                                                    <span className={`${styles.dot} ${u.is_active ? styles.dotActive : styles.dotInactive}`} />
                                                    <span className={styles.userName}>{u.name}</span>
                                                    {u.extension && <span className={styles.exten}>({u.extension})</span>}
                                                    <span className={`${styles.badge} ${roleLabel(u.role).cls}`}>{roleLabel(u.role).label}</span>
                                                </span>
                                            ) : null;
                                        })() : (
                                            <span className={styles.placeholder}>상담원을 선택하세요</span>
                                        )}
                                        <span className={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</span>
                                    </button>
                                    {dropdownOpen && (
                                        <ul className={styles.list}>
                                            <li
                                                className={`${styles.item} ${selectedUserId === "" ? styles.itemSelected : ""}`}
                                                onClick={() => handleUserSelect("")}
                                            >
                                                <span className={styles.placeholder}>선택 안 함</span>
                                            </li>
                                            {users.filter(u => u.role !== "SYSTEM_ADMIN" && u.extension).map(u => (
                                                <li
                                                    key={u.id}
                                                    className={`${styles.item} ${selectedUserId === u.id ? styles.itemSelected : ""}`}
                                                    onClick={() => handleUserSelect(u.id)}
                                                >
                                                    <span className={`${styles.dot} ${u.is_active ? styles.dotActive : styles.dotInactive}`} />
                                                    <span className={styles.userName}>{u.name}</span>
                                                    <span className={styles.exten}>({u.extension})</span>
                                                    <span className={`${styles.badge} ${roleLabel(u.role).cls}`}>{roleLabel(u.role).label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <label className="ivr-field-label">연결 큐</label>
                                <select
                                    className="ivr-field-select"
                                    value={queueId ?? ""}
                                    onChange={e => setQueueId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">큐를 선택하세요</option>
                                    {queues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                </select>
                            </>
                        )}
                    
                    </>
                )}

                {nodeType === "voicemail" && (
                    <>
                        <label className="ivr-field-label">음성사서함</label>
                        <input className="ivr-field-input" value={mailbox} onChange={e => setMailbox(e.target.value)} placeholder="예: 1001@default" />
                    </>
                )}
            </div>

            <div className="ivr-editor-footer">
                {isEdit && canDelete && (
                    <button className="btn-ivr-delete" onClick={() => onDelete(editorMode.node.id)}>삭제</button>
                )}
                {canUpdate && (
                    <button className="btn-ivr-save" onClick={handleSave}>저장</button>
                )}
            </div>
        </div>
    );
}
