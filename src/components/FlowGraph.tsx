import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  type BlockId,
  type FlowEdge,
  type FlowNode,
  type Phase,
  getEdgesForBlock,
  getNodesForBlock,
} from "../data/pod-flow";
import PodFlowNode from "./PodFlowNode";

type FlowGraphProps = {
  block: BlockId;
  phase: Phase | "all";
  selectedNodeId: string | null;
  activeNodeId: string | null;
  activeEdgeId: string | null;
  highlightedNodeIds: Set<string>;
  onNodeClick: (node: FlowNode) => void;
  onEdgeClick: (edge: FlowEdge) => void;
  interactive: boolean;
};

const nodeTypes = { pod: PodFlowNode };

/** Design-time column width — x positions scale up on wider cards. */
const LAYOUT_BASE_WIDTH = 340;

function layoutScaleForWidth(width: number): number {
  return Math.max(1, Math.min(2.4, (width - 48) / LAYOUT_BASE_WIDTH));
}

function toReactFlowNodes(
  nodes: FlowNode[],
  selectedNodeId: string | null,
  activeNodeId: string | null,
  highlightedNodeIds: Set<string>,
  phase: Phase | "all",
  layoutScale: number,
): Node[] {
  const hasHighlight = highlightedNodeIds.size > 0 || activeNodeId !== null;

  return nodes
    .filter((n) => phase === "all" || n.phase === phase || n.phase === "both")
    .map((n) => {
      const active = activeNodeId === n.id;
      const selected = selectedNodeId === n.id;
      const inHighlight = highlightedNodeIds.has(n.id);
      const dimmed = hasHighlight && !active && !selected && !inHighlight;

      return {
        id: n.id,
        type: "pod",
        position: {
          x: n.position.x * layoutScale,
          y: n.position.y,
        },
        data: {
          flowNode: n,
          active,
          dimmed,
          selected,
        },
        draggable: false,
        selectable: false,
      };
    });
}

function toReactFlowEdges(
  edges: FlowEdge[],
  activeEdgeId: string | null,
  highlightedEdgeIds: Set<string>,
  phase: Phase | "all",
): Edge[] {
  const hasHighlight = highlightedEdgeIds.size > 0 || activeEdgeId !== null;

  return edges
    .filter((e) => phase === "all" || e.phase === phase || e.phase === "both")
    .map((e) => {
      const active = activeEdgeId === e.id;
      const highlighted = highlightedEdgeIds.has(e.id);
      const dimmed = hasHighlight && !active && !highlighted;

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: active,
        className: [
          "pod-edge",
          active ? "pod-edge--active" : "",
          highlighted ? "pod-edge--highlighted" : "",
          dimmed ? "pod-edge--dimmed" : "",
        ]
          .filter(Boolean)
          .join(" "),
        labelStyle: { fill: "var(--ink)", fontSize: 11, fontWeight: 500 },
        labelBgStyle: { fill: "rgba(255,255,255,0.92)", fillOpacity: 0.95 },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
      };
    });
}

export default function FlowGraph({
  block,
  phase,
  selectedNodeId,
  activeNodeId,
  activeEdgeId,
  highlightedNodeIds,
  onNodeClick,
  onEdgeClick,
  interactive,
}: FlowGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const [containerWidth, setContainerWidth] = useState(LAYOUT_BASE_WIDTH);

  const layoutScale = layoutScaleForWidth(containerWidth);

  const blockNodes = useMemo(() => getNodesForBlock(block), [block]);
  const blockEdges = useMemo(() => getEdgesForBlock(block, phase), [block, phase]);

  const highlightedEdgeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    return new Set(
      blockEdges
        .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
        .map((e) => e.id),
    );
  }, [blockEdges, selectedNodeId]);

  const initialNodes = useMemo(
    () =>
      toReactFlowNodes(
        blockNodes,
        selectedNodeId,
        activeNodeId,
        highlightedNodeIds,
        phase,
        layoutScale,
      ),
    [
      blockNodes,
      selectedNodeId,
      activeNodeId,
      highlightedNodeIds,
      phase,
      layoutScale,
    ],
  );

  const initialEdges = useMemo(
    () =>
      toReactFlowEdges(blockEdges, activeEdgeId, highlightedEdgeIds, phase),
    [blockEdges, activeEdgeId, highlightedEdgeIds, phase],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(
      toReactFlowNodes(
        blockNodes,
        selectedNodeId,
        activeNodeId,
        highlightedNodeIds,
        phase,
        layoutScale,
      ),
    );
  }, [
    blockNodes,
    selectedNodeId,
    activeNodeId,
    highlightedNodeIds,
    phase,
    layoutScale,
    setNodes,
  ]);

  useEffect(() => {
    setEdges(
      toReactFlowEdges(blockEdges, activeEdgeId, highlightedEdgeIds, phase),
    );
  }, [blockEdges, activeEdgeId, highlightedEdgeIds, phase, setEdges]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      flowRef.current?.fitView({ padding: 0.1, duration: 200 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [layoutScale, block, phase, blockNodes.length]);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    flowRef.current = instance;
    instance.fitView({ padding: 0.1 });
  }, []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!interactive) return;
      const flowNode = blockNodes.find((n) => n.id === node.id);
      if (flowNode) onNodeClick(flowNode);
    },
    [blockNodes, interactive, onNodeClick],
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (!interactive) return;
      const flowEdge = blockEdges.find((e) => e.id === edge.id);
      if (flowEdge) onEdgeClick(flowEdge);
    },
    [blockEdges, interactive, onEdgeClick],
  );

  return (
    <div className="flow-graph" ref={containerRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={handleInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.35}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="rgba(131,146,178,0.15)" />
        {interactive && <Controls showInteractive={false} position="bottom-right" />}
      </ReactFlow>
    </div>
  );
}
