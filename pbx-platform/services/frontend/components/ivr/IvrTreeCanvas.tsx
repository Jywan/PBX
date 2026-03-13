"use client";

import { useRef, useEffect, useMemo } from "react";
import { ReactDiagram } from "gojs-react";
import * as go from "gojs";
import type { IvrFlow, IvrNode, IvrNodeType } from "@/types/ivr";

const NODE_TYPE_COLOR: Record<IvrNodeType, string> = {
    greeting:   "#4f80ff",
    menu:       "#f59e0b",
    transfer:   "#22c55e",
    hangup:     "#ef4444",
    voicemail:  "#8b5cf6",
};

const NODE_TYPE_LABEL: Record<IvrNodeType, string> = {
    greeting:   "안내멘트",
    menu:       "메뉴선택",
    transfer:   "내선연결",
    hangup:     "종료",
    voicemail:  "음성메세지",
};

interface NodeData {
    key:        number;
    name:       string;
    nodeType:   string;
    dtmfKey:    string | null;
    color:      string;
    label:      string;
}

function buildGoJsData(nodes: IvrNode[]) {
    const sorted = [...nodes].sort((a, b) => a.sort_order - b.sort_order);
    const nodeDataArray: NodeData[] = sorted.map(n => ({
        key: n.id,
        name: n.name,
        nodeType: n.node_type,
        dtmfKey: n.dtmf_key ?? null,
        color: NODE_TYPE_COLOR[n.node_type as IvrNodeType] ?? "#8b95a1",
        label: NODE_TYPE_LABEL[n.node_type as IvrNodeType] ?? n.node_type,
    }));
    const linkDataArray = sorted
        .filter(n => n.parent_id !== null)
        .map(n => ({ key: `${n.parent_id}-${n.id}`, from: n.parent_id as number, to: n.id }));
    return { nodeDataArray, linkDataArray };
}

function initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, {
        "undoManager.isEnabled": false,
        allowCopy: false,
        allowDelete: false,
        allowInsert: false,
        "toolManager.mouseWheelBehavior": go.WheelMode.Zoom,
        model: new go.GraphLinksModel({ linkKeyProperty: "key" }),
        layout: $(go.TreeLayout, {
            angle: 90,
            layerSpacing: 80,
            nodeSpacing: 24,
            alignment: go.TreeAlignment.CenterChildren,
        }),
        padding: new go.Margin(40),
        initialAutoScale: go.AutoScale.Uniform,
        initialContentAlignment: go.Spot.Center,
    });

    diagram.nodeTemplate = $(go.Node, "Auto",
        {
            cursor: "pointer",
            selectionAdornmentTemplate: $(go.Adornment, "Auto",
                $(go.Shape, "RoundedRectangle",
                    { fill: null, stroke: "#4f80ff", strokeWidth: 2.5, parameter1: 10 }
                ),
                $(go.Placeholder, { margin: -1 })
            ),
        },
        $(go.Shape, "RoundedRectangle",
            {
                parameter1: 10,
                strokeWidth: 1.5,
                stroke: "#e5e8eb",
                fill: "white",
            }
        ),
        $(go.Panel, "Vertical",
            { defaultAlignment: go.Spot.Left },
            // 상단 컬러 바
            $(go.Shape, "Rectangle",
                {
                    height: 4,
                    stretch: go.Stretch.Horizontal,
                    strokeWidth: 0,
                },
                new go.Binding("fill", "color")
            ),
            // 카드 내용
            $(go.Panel, "Vertical",
                {
                    margin: new go.Margin(8, 12, 10, 12),
                    defaultAlignment: go.Spot.Left,
                },
                // 헤더: 뱃지 + DTMF
                $(go.Panel, "Horizontal",
                    {
                        margin: new go.Margin(0, 0, 6, 0),
                        defaultAlignment: go.Spot.Center,
                    },
                    // 노드 유형 뱃지
                    $(go.Panel, "Auto",
                        $(go.Shape, "RoundedRectangle",
                            { parameter1: 20, fill: "#f3f4f6", strokeWidth: 0 }
                        ),
                        $(go.TextBlock,
                            { font: "bold 10px sans-serif", margin: new go.Margin(2, 8) },
                            new go.Binding("text", "label"),
                            new go.Binding("stroke", "color")
                        ),
                    ),
                    // DTMF 키 원형 뱃지
                    $(go.Panel, "Auto",
                        { margin: new go.Margin(0, 0, 0, 6) },
                        new go.Binding("visible", "dtmfKey", (k: string | null) => !!k),
                        $(go.Shape, "Ellipse",
                            { width: 22, height: 22, strokeWidth: 0 },
                            new go.Binding("fill", "color")
                        ),
                        $(go.TextBlock,
                            {
                                font: "bold 11px sans-serif",
                                stroke: "white",
                                textAlign: "center",
                                verticalAlignment: go.Spot.Center,
                            },
                            new go.Binding("text", "dtmfKey", (k: string | null) => k ?? "")
                        ),
                    ),
                ),
                // 노드 이름
                $(go.TextBlock,
                    {
                        font: "600 13px sans-serif",
                        stroke: "#191f28",
                        width: 144,
                        overflow: go.TextOverflow.Ellipsis,
                        wrap: go.Wrap.None,
                    },
                    new go.Binding("text", "name")
                ),
            ),
        ),
    );

    diagram.linkTemplate = $(go.Link,
        {
            routing: go.Routing.Orthogonal,
            corner: 6,
            selectable: false,
        },
        $(go.Shape, { strokeWidth: 2, stroke: "#b0b8c4" }),
    );

    return diagram;
}

interface Props {
    flow: IvrFlow | null;
    selectedNodeId: number | null;
    onSelectNode: (node: IvrNode) => void;
    onAddChildNode: (parentNode: IvrNode) => void;
    onAddRootNode: () => void;
    onReparentNode: (nodeId: number, newParentId: number | null) => void;
    canUpdate: boolean;
}

export default function IvrTreeCanvas({
    flow, selectedNodeId, onSelectNode, onAddChildNode, onAddRootNode, onReparentNode, canUpdate,
}: Props) {
    const diagramRef = useRef<ReactDiagram>(null);
    const flowRef = useRef(flow);
    const onSelectNodeRef = useRef(onSelectNode);
    const onReparentNodeRef = useRef(onReparentNode);
    useEffect(() => { flowRef.current = flow; }, [flow]);
    useEffect(() => { onSelectNodeRef.current = onSelectNode; }, [onSelectNode]);
    useEffect(() => { onReparentNodeRef.current = onReparentNode; }, [onReparentNode]);

    const { nodeDataArray, linkDataArray } = useMemo(() => {
        if (!flow?.nodes?.length) return { nodeDataArray: [], linkDataArray: [] };
        return buildGoJsData(flow.nodes);
    }, [flow?.nodes]);

    // allowMove: canUpdate 동기화
    useEffect(() => {
        const diagram = diagramRef.current?.getDiagram();
        if (!diagram) return;
        diagram.allowMove = canUpdate;
    }, [canUpdate, nodeDataArray.length]);

    // 클릭 + drag reparent 이벤트 등록
    useEffect(() => {
        if (!nodeDataArray.length) return;

        let diagram: go.Diagram | null = null;

        const handleClick = (e: go.DiagramEvent) => {
            const part = e.subject?.part;
            if (part instanceof go.Node) {
                const data = part.data as NodeData;
                const ivrNode = flowRef.current?.nodes.find(n => n.id === data.key);
                if (ivrNode) onSelectNodeRef.current(ivrNode);
            }
        };

        const handleMoved = (e: go.DiagramEvent) => {
            const diagram = e.diagram;
            e.subject.each((part: go.Part) => {
                if (!(part instanceof go.Node)) return;
                const droppedData = part.data as NodeData;
                const droppedBounds = part.actualBounds;
        
                let targetNode: go.Node | null = null;
                diagram.nodes.each((n: go.Node) => {
                    if (n === part) return;
                    if (n.actualBounds.intersectsRect(droppedBounds)) {
                        targetNode = n;
                    }
                });
        
                if (targetNode) {
                    const targetData = (targetNode as go.Node).data as NodeData;
                    onReparentNodeRef.current(droppedData.key, targetData.key);
                } else {
                    // 빈 공간에 드롭 시 레이아웃 복원
                    setTimeout(() => diagram.layoutDiagram(true), 0);
                }
            });
        };

        const tid = setTimeout(() => {
            diagram = diagramRef.current?.getDiagram() ?? null;
            if (!diagram) return;
            diagram.allowMove = canUpdate;
            diagram.addDiagramListener("ObjectSingleClicked", handleClick);
            diagram.addDiagramListener("SelectionMoved", handleMoved);
        }, 0);

        return () => {
            clearTimeout(tid);
            diagram?.removeDiagramListener("ObjectSingleClicked", handleClick);
            diagram?.removeDiagramListener("SelectionMoved", handleMoved);
        };
    }, [nodeDataArray.length, canUpdate]);

    // flow.nodes 변경 시 GoJS 모델 직접 동기화 + 레이아웃 재실행
    useEffect(() => {
        const diagram = diagramRef.current?.getDiagram();
        if (!diagram || !flow?.nodes?.length) return;

        const model = diagram.model as go.GraphLinksModel;
        model.mergeNodeDataArray(nodeDataArray);
        model.mergeLinkDataArray(linkDataArray);
        diagram.layoutDiagram(true);
    }, [flow?.nodes]);

    // 선택 노드 동기화
    useEffect(() => {
        const diagram = diagramRef.current?.getDiagram();
        if (!diagram) return;
        diagram.clearSelection();
        if (selectedNodeId !== null) {
            const node = diagram.findNodeForKey(selectedNodeId);
            if (node) diagram.select(node);
        }
    }, [selectedNodeId]);

    // 플로우 전환 시 전체보기
    useEffect(() => {
        const diagram = diagramRef.current?.getDiagram();
        if (diagram && flow?.nodes?.length) {
            setTimeout(() => diagram.zoomToFit(), 100);
        }
    }, [flow?.id]);

    const handleZoomIn    = () => diagramRef.current?.getDiagram()?.commandHandler.increaseZoom();
    const handleZoomOut   = () => diagramRef.current?.getDiagram()?.commandHandler.decreaseZoom();
    const handleZoomReset = () => diagramRef.current?.getDiagram()?.zoomToFit();

    if (!flow) {
        return (
            <div className="ivr-canvas-empty">
                <span>왼쪽에서 IVR 플로우를 선택하세요.</span>
            </div>
        );
    }

    const selectedNode = selectedNodeId !== null
        ? (flow.nodes?.find(n => n.id === selectedNodeId) ?? null)
        : null;

    return (
        <div className="ivr-canvas-wrap">
            <div className="ivr-canvas-toolbar">
                <span className="ivr-canvas-flow-name">{flow.name}</span>
                <div className="ivr-canvas-toolbar-actions">
                    {canUpdate && selectedNode && (
                        <button className="btn-ivr-add-child" onClick={() => onAddChildNode(selectedNode)}>
                            + 하위 노드 추가
                        </button>
                    )}
                    {canUpdate && (
                        <button className="btn-ivr-add-root" onClick={onAddRootNode}>
                            + 루트 노드 추가
                        </button>
                    )}
                </div>
            </div>
            <div className="ivr-canvas-inner">
                {nodeDataArray.length > 0 ? (
                    <ReactDiagram
                        ref={diagramRef}
                        divClassName="ivr-gojs-diagram"
                        initDiagram={initDiagram}
                        nodeDataArray={nodeDataArray}
                        linkDataArray={linkDataArray}
                        onModelChange={() => {}}
                    />
                ) : (
                    <div className="ivr-canvas-hint">
                        <p>아직 노드가 없습니다.</p>
                        {canUpdate && (
                            <button className="btn-ivr-add-root" onClick={onAddRootNode}>
                                + 루트 노드 추가
                            </button>
                        )}
                    </div>
                )}
                <div className="ivr-canvas-zoom-controls">
                    <button className="ivr-zoom-btn" onClick={handleZoomIn} title="확대">+</button>
                    <button className="ivr-zoom-btn" onClick={handleZoomOut} title="축소">-</button>
                    <button className="ivr-zoom-btn ivr-zoom-reset" onClick={handleZoomReset} title="전체보기">⊞</button>
                </div>
            </div>
        </div>
    );
}
