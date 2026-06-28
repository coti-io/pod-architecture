import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNode } from "../data/pod-flow";

export type PodNodeData = {
  flowNode: FlowNode;
  active: boolean;
  dimmed: boolean;
  selected: boolean;
};

function PodFlowNode({ data }: NodeProps) {
  const { flowNode, active, dimmed, selected } = data as PodNodeData;
  const kind = flowNode.kind ?? "contract";

  return (
    <div
      className={[
        "pod-node",
        `pod-node--${kind}`,
        active ? "pod-node--active" : "",
        dimmed ? "pod-node--dimmed" : "",
        selected ? "pod-node--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Handle type="target" position={Position.Top} className="pod-handle" />
      <div className="pod-node__label">{flowNode.label}</div>
      {flowNode.subtitle && (
        <div className="pod-node__subtitle">{flowNode.subtitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="pod-handle" />
    </div>
  );
}

export default memo(PodFlowNode);
