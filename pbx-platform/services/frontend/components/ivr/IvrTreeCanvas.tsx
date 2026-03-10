"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, NodeTypes, Handle, Position } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { IvrFlow, IvrNode, IvrNodeType } from "@/types/ivr";

const NODE_TYPE_LABEL: Record<IvrNodeType, string> = {
    greeting: "안내멘트",
    menu: "메뉴선택",
    transfer: "내선연결",
    hangup: "종료",
    voicemail: "음성메세지",
};

const NODE_TYPE_COLOR: Record<IvrNodeType, string> = {
    greeting: "#4f80ff",
    menu: "#f59e0b",
    transfer: "#22c55e",
    hangup: "#ef4444",
    voicemail: "#8b5cf6",
};

function IvrNodeCard({ data }: {data: {node: IvrNode; onSelect: (n: IvrNode) => void; onAddChild: (n: IvrNode) => void; selected: boolean} }) {
    const { node, onSelect, onAddChild, selected } = data;
    const color = NODE_TYPE_COLOR[node.node_type as IvrNodeType] ?? "#8b95a1";
    const label = NODE_TYPE_LABEL[node.node_type as IvrNodeType] ?? node.node_type;

    return (
        <div
            className={`ivr-node-card ${selected ? "selected" : ""}`}
            style={{ borderTopColor: color }}
            onClick={() => onSelect(node)}
        >
            <Handle type="target" position={Position.Top} />
            <div className="ivr-node-type-badge" style={{ background: color }}>{label}</div>
            {node.dtmf_key && <div className="ivr-node-dtmf">키: {node.dtmf_key}</div>}
            <div className="ivr-node-name">{node.name}</div>
            <button
                className="btn-add-child"
                onClick={e => { e.stopPropagation(); onAddChild(node); }}
                title="하위 노드 추가"
            >+</button>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

const nodeTypes: NodeTypes = { ivrNode: IvrNodeCard };

// 평탄한 nodes 배열 - 트리 레이아웃 계산
function buildGraphElements(
    nodes: IvrNode[],
    selectedNodeId: number | null,
    onSelect: (n: IvrNode) => void,
    onAddChild: (n: IvrNode) => void,
): { rfNodes: Node[]; rfEdges: Edge[] } {
    if (!nodes.length) return { rfNodes: [], rfEdges: [] };

    // 부모별 자식 목록
    const childrenMap = new Map<number | null, IvrNode[]>();
    nodes.forEach(n => {
        const pid = n.parent_id;
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(n);
    });

    const rfNodes: Node[] = [];
    const rfEdges: Edge[] = [];
    const X_GAP = 180;
    const Y_Gap = 120;

    // BFS 레이아웃
    function layout(parentId: number | null, x: number, y: number): number {
        const children = (childrenMap.get(parentId) ?? []).sort((a, b) => a.sort_order - b.sort_order);
        if (!children.length) return x;
        let startX =x;
        children.forEach(child => {
            rfNodes.push({
                id: String(child.id),
                type: "ivrNode",
                position: { x: startX, y },
                data: { node: child, onSelect, onAddChild, selected: child.id === selectedNodeId },
            });
            if (child.parent_id !== null) {
                rfEdges.push({
                    id: `e-${child.parent_id}-${child.id}`,
                    source: String(child.parent_id),
                    target: String(child.id),
                    label: child.dtmf_key ? `[${child.dtmf_key}]` : undefined,
                });
            }
            startX = layout(child.id, startX, y + Y_Gap) + X_GAP;
        })
        return startX - X_GAP; 
    }

    // 루트 노드 (parent_id === null)
    const roots = childrenMap.get(null) ?? [];
    let rootX = 0;
    roots.forEach(root => {
        rfNodes.push({
            id: String(root.id),
            type: "ivrNode",
            position: { x: rootX, y: 0 },
            data: { node: root, onSelect, onAddChild, selected: root.id === selectedNodeId },
        });
        rootX = layout(root.id, rootX, Y_Gap) + X_GAP;
    })

    return { rfNodes, rfEdges };
}

interface Props {
    flow: IvrFlow | null;
    selectedNodeId: number | null;
    onSelectNode: (node: IvrNode) => void;
    onAddChildNode: (parentNode: IvrNode) => void;
    onAddRootNode: () => void;
}

export default function IvrTreeCanvas({ flow, selectedNodeId, onSelectNode, onAddChildNode, onAddRootNode }: Props) {
    const { rfNodes, rfEdges } = useMemo(
        () => buildGraphElements(flow?.nodes ?? [], selectedNodeId, onSelectNode, onAddChildNode),
        [flow?.nodes, selectedNodeId, onSelectNode, onAddChildNode]
    );


    if (!flow) {
        return (
            <div className="ivr-canvas-empty">
                <span>왼쪽에서 IVR 플로우를 선택하세요.</span>
            </div>
        )
    }

    return (
        <div className="ivr-canvas-wrap">
            <div className="ivr-canvas-toolbar">
                <span className="ivr-canvas-flow-name">{flow.name}</span>
                <button className="btn-ivr-add-root" onClick={onAddRootNode}>+ 루트 노드 추가</button>
            </div>
            <div className="ivr-canvas-inner">
                <ReactFlow
                    nodes={rfNodes}
                    edges={rfEdges}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}