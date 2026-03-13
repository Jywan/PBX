"use client";

import { useState, useEffect } from "react";
import type { IvrNode, IvrNodeType, IvrNodeCreate, IvrNodeUpdate } from "@/types/ivr";

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
    onSaveAdd: (data: IvrNodeCreate) => void;
    onSaveEdit: (nodeId: number, data: IvrNodeUpdate) => void;
    onDelete: (nodeId: number) => void;
    onClose: () => void;
    canUpdate: boolean;
    canDelete: boolean;
}

export default function IvrNodeEditor({ editorMode, onSaveAdd, onSaveEdit, onDelete, onClose, canUpdate, canDelete }: Props) {
    const [nodeType, setNodeType] = useState<IvrNodeType>("greeting");
    const [name, setName] = useState("");
    const [dtmfKey, setDtmfKey] = useState("");
    const [message, setMessage] = useState("");
    const [prompt, setPrompt] = useState("");
    const [timeout, setTimeoutVal] = useState(5);
    const [targetExten, setTargetExten] = useState("");
    const [mailbox, setMailbox] = useState("");

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
            setMailbox(n.config.mailbox ?? "")
        } else {
            setNodeType("greeting");
            setName("");
            setDtmfKey("");
            setMessage("");
            setPrompt("");
            setTimeoutVal(5);
            setTargetExten("");
            setMailbox("");
        }
    }, [editorMode]);

    if (!editorMode) {
        return (
            <div className="ivr-editor-empty">
                <span>노드를 선택하거나 추가 버튼을 누르세요</span>
            </div>
        );
    }

    const buildConfig = () => {
        if (nodeType === "greeting") return {message};
        if (nodeType === "menu") return { prompt, timeout };
        if (nodeType === "transfer") return { target_exten: targetExten };
        if (nodeType === "voicemail") return { mailbox };
        return {};
    };

    const handleSave = () => {
        if (!name.trim()) return;
        if (editorMode.mode === "add") {
            const data: IvrNodeCreate = {
                flow_id: editorMode.flowId,
                parent_id: editorMode.parentNode?.id ?? null,
                node_type: nodeType,
                name: name.trim(),
                dtmf_key: dtmfKey || null,
                config: buildConfig(),
            };
            onSaveAdd(data);
        } else {
            const data: IvrNodeUpdate = {
                node_type: nodeType,
                name: name.trim(),
                dtmf_key: dtmfKey || null,
                config: buildConfig(),
            };
            onSaveEdit(editorMode.node.id, data);
        }
    };

    const isEdit = editorMode.mode === "edit";
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
                        <label className="ivr-field-label">연결 내선번호</label>
                        <input className="ivr-field-input" value={targetExten} onChange={e => setTargetExten(e.target.value)} placeholder="예: 1001" />
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
