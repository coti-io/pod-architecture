import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blocks,
  type BlockId,
  type FlowEdge,
  type FlowNode,
  type Phase,
  getNodeById,
  getStepEdge,
  getDisplayEdgeId,
  getStepTargetNode,
  totalJourneySteps,
} from "../data/pod-flow";
import CrossBlockLinks, {
  CrossBlockConnector,
  CrossLinkStep,
} from "./CrossBlockLinks";
import FeeStackPanel from "./FeeStackPanel";
import FlowGraph from "./FlowGraph";
import JourneyControls from "./JourneyControls";
import JourneyFeeStack from "./JourneyFeeStack";
import NodeDetailPanel from "./NodeDetailPanel";
import ZoomableBlock from "./ZoomableBlock";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export default function OverviewLayout() {
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [focusedBlock, setFocusedBlock] = useState<BlockId | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowEdge | null>(null);
  const [phase, setPhase] = useState<"outbound" | "return" | "all">("all");
  const [journeyStep, setJourneyStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const activeNodeId = useMemo(() => {
    if (journeyStep <= 0) return null;
    const edge = getStepEdge(journeyStep);
    return edge?.target ?? null;
  }, [journeyStep]);

  const activeEdgeId = useMemo(() => {
    if (journeyStep <= 0) return null;
    return getDisplayEdgeId(journeyStep, phase);
  }, [journeyStep, phase]);

  const highlightedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set([selectedNode.id]);
  }, [selectedNode]);

  const displayPhase: Phase | "all" = phase;

  const handleNodeClick = useCallback((node: FlowNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setFocusedBlock(node.block);
  }, []);

  const handleEdgeClick = useCallback((edge: FlowEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(getNodeById(edge.target) ?? null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setJourneyStep(0);
    setSelectedNode(null);
    setSelectedEdge(null);
    setFocusedBlock(null);
  }, []);

  const handleStep = useCallback(() => {
    setPlaying(false);
    setJourneyStep((s) => Math.min(s + 1, totalJourneySteps));
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (journeyStep >= totalJourneySteps) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setJourneyStep((s) => s + 1);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [playing, journeyStep]);

  useEffect(() => {
    if (journeyStep <= 0) return;
    const target = getStepTargetNode(journeyStep);
    const edge = getStepEdge(journeyStep);
    if (target) {
      setSelectedNode(target);
      setFocusedBlock(target.block);
    }
    if (edge) setSelectedEdge(edge);
  }, [journeyStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedNode || selectedEdge) {
          handleClosePanel();
        } else if (focusedBlock) {
          setFocusedBlock(null);
        } else {
          handleReset();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedBlock, handleClosePanel, handleReset, selectedEdge, selectedNode]);

  const showConnectors = !isMobile && !focusedBlock;

  const renderBlock = (meta: (typeof blocks)[number]) => {
    const focused = focusedBlock === meta.id;
    const dimmed = focusedBlock !== null && !focused;

    return (
      <ZoomableBlock
        key={meta.id}
        meta={meta}
        focused={focused}
        dimmed={dimmed}
        onFocus={() => setFocusedBlock(meta.id)}
        onBlur={() => setFocusedBlock(null)}
      >
        <FlowGraph
          block={meta.id}
          phase={displayPhase}
          selectedNodeId={selectedNode?.id ?? null}
          activeNodeId={activeNodeId}
          activeEdgeId={activeEdgeId}
          highlightedNodeIds={highlightedNodeIds}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          interactive={!dimmed || focused}
        />
      </ZoomableBlock>
    );
  };

  return (
    <div className="overview">
      <header className="hero">
        <span className="hero-tag">Privacy on Demand</span>
        <h1>How PoD works</h1>
        <p>
          Follow an encrypted <strong>MpcAdder</strong> request from Sepolia through the relayer stack to COTI MPC execution and back.
          <br />
          Click any block to zoom in, or play the full journey step by step.
        </p>
        <nav className="hero-links" aria-label="Related documentation">
          <a
            href="https://docs.coti.io/coti-documentation/privacy-on-demand"
            target="_blank"
            rel="noreferrer"
          >
            Privacy on Demand documentation
          </a>
        </nav>
      </header>

      <div
        className={[
          "blocks-grid",
          showConnectors ? "blocks-grid--connected" : "",
          focusedBlock ? "blocks-grid--focused" : "",
          isMobile ? "blocks-grid--mobile" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showConnectors
          ? blocks.flatMap((meta, index) => {
              const elements = [renderBlock(meta)];
              if (index < blocks.length - 1) {
                elements.push(
                  <CrossBlockConnector
                    key={`cross-${meta.id}`}
                    linkIndex={index}
                    activeStep={journeyStep}
                    phase={phase}
                  />,
                );
              }
              return elements;
            })
          : blocks.map((meta) => renderBlock(meta))}
      </div>

      {!isMobile && <CrossLinkStep activeStep={journeyStep} />}

      {isMobile && !focusedBlock && (
        <CrossBlockLinks activeStep={journeyStep} phase={phase} layout="vertical" />
      )}

      <JourneyControls
        playing={playing}
        step={journeyStep}
        totalSteps={totalJourneySteps}
        phase={phase}
        onPlay={() => {
          if (journeyStep >= totalJourneySteps) setJourneyStep(0);
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onStep={handleStep}
        onReset={handleReset}
        onPhaseChange={setPhase}
      />

      <JourneyFeeStack journeyStep={journeyStep} playing={playing} />

      <FeeStackPanel />

      <NodeDetailPanel
        node={selectedNode}
        edge={selectedEdge}
        step={journeyStep > 0 ? journeyStep : null}
        onClose={handleClosePanel}
        mobile={isMobile}
      />
    </div>
  );
}
