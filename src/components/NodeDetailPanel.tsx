import type { FlowEdge, FlowNode } from "../data/pod-flow";
import { getGithubUrl } from "../data/pod-flow";

type NodeDetailPanelProps = {
  node: FlowNode | null;
  edge: FlowEdge | null;
  step: number | null;
  onClose: () => void;
  mobile?: boolean;
};

export default function NodeDetailPanel({
  node,
  edge,
  step,
  onClose,
  mobile = false,
}: NodeDetailPanelProps) {
  const open = node !== null || edge !== null;

  if (!open) return null;

  const githubUrl = node ? getGithubUrl(node) : null;

  return (
    <aside
      className={["detail-panel", mobile ? "detail-panel--mobile" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <div className="detail-panel__header">
        <span className="eyebrow">
          {edge ? "Call" : node?.block === "relayer" ? "Service" : "Contract"}
        </span>
        <button type="button" className="detail-panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {node && (
        <>
          <h2 className="detail-panel__title">{node.label}</h2>
          {node.subtitle && <p className="detail-panel__file">{node.subtitle}</p>}
          {node.signature && (
            <code className="detail-panel__signature">{node.signature}</code>
          )}
          <p className="detail-panel__desc">{node.description}</p>
          {step !== null && (
            <p className="detail-panel__step">Journey step {step}</p>
          )}
          {githubUrl && (
            <a
              className="detail-panel__link"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              View source on GitHub
            </a>
          )}
        </>
      )}

      {edge && !node && (
        <>
          <h2 className="detail-panel__title">{edge.label}</h2>
          <p className="detail-panel__desc">
            {edge.crossBlock
              ? "Cross-block handoff between the three main zones."
              : "Internal call within this block."}
          </p>
          <p className="detail-panel__step">
            Step {edge.step} · {edge.phase === "return" ? "Return leg" : "Outbound"}
          </p>
        </>
      )}
    </aside>
  );
}
