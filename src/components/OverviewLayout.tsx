import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type BlockId,
  type FlowEdge,
  type FlowNode,
  type Phase,
  getBlocks,
  getFlowDataset,
  getNodeById,
  getStepEdge,
  getDisplayEdgeId,
  getStepTargetNode,
  localizeFlowNode,
} from "../data/pod-flow";
import { useNetwork } from "../network/NetworkContext";
import CrossBlockLinks, {
  CrossBlockConnector,
  CrossLinkStep,
} from "./CrossBlockLinks";
import DummyFlowStrip from "./DummyFlowStrip";
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
  const network = useNetwork();
  const blocks = useMemo(() => getBlocks(network), [network]);
  const flow = useMemo(() => getFlowDataset(network), [network]);
  const totalSteps = flow.totalSteps;
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [focusedBlock, setFocusedBlock] = useState<BlockId | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowEdge | null>(null);
  const [phase, setPhase] = useState<"outbound" | "return" | "all">("all");
  const [journeyStep, setJourneyStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const activeNodeId = useMemo(() => {
    if (journeyStep <= 0) return null;
    const edge = getStepEdge(journeyStep, network);
    return edge?.target ?? null;
  }, [journeyStep, network]);

  const activeEdgeId = useMemo(() => {
    if (journeyStep <= 0) return null;
    return getDisplayEdgeId(journeyStep, phase, network);
  }, [journeyStep, phase, network]);

  const highlightedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set([selectedNode.id]);
  }, [selectedNode]);

  const displayPhase: Phase | "all" = phase;

  const handleNodeClick = useCallback(
    (node: FlowNode) => {
      setSelectedNode(localizeFlowNode(node, network));
      setSelectedEdge(null);
      setFocusedBlock(node.block);
    },
    [network],
  );

  const handleEdgeClick = useCallback(
    (edge: FlowEdge) => {
      setSelectedEdge(edge);
      const target = getNodeById(edge.target, network);
      setSelectedNode(target ? localizeFlowNode(target, network) : null);
    },
    [network],
  );

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
    setJourneyStep((s) => Math.min(s + 1, totalSteps));
  }, [totalSteps]);

  useEffect(() => {
    if (!playing) return;
    if (journeyStep >= totalSteps) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setJourneyStep((s) => s + 1);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [playing, journeyStep, totalSteps]);

  useEffect(() => {
    if (journeyStep <= 0) return;
    const target = getStepTargetNode(journeyStep, network);
    const edge = getStepEdge(journeyStep, network);
    if (target) {
      setSelectedNode(localizeFlowNode(target, network));
      setFocusedBlock(target.block);
    }
    if (edge) setSelectedEdge(edge);
  }, [journeyStep, network]);

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

  const heroLeadParts = network.heroLead.split(network.heroEmphasis);

  return (
    <div className="overview">
      <header className="hero">
        <span className="hero-tag">{network.heroTag}</span>
        <h1>{network.heroTitle}</h1>
        <p>
          {heroLeadParts.length === 2 ? (
            <>
              {heroLeadParts[0]}
              <strong>{network.heroEmphasis}</strong>
              {heroLeadParts[1]}
            </>
          ) : (
            network.heroLead
          )}
          <br />
          Click any block to zoom in, or play the full journey step by step.
        </p>
        <nav className="hero-links" aria-label="Related documentation">
          <a href={network.docsHref} target="_blank" rel="noreferrer">
            {network.docsLabel}
          </a>
          <a href={network.explorerHref} target="_blank" rel="noreferrer">
            {network.explorerLabel}
          </a>
          {network.exampleRepoHref && (
            <a
              href={network.exampleRepoHref}
              target="_blank"
              rel="noreferrer"
            >
              {network.exampleRepoLabel ?? "Example repository"}
            </a>
          )}
          {network.alternate && (
            <a href={network.alternate.href}>{network.alternate.label}</a>
          )}
        </nav>
      </header>

      <DummyFlowStrip
        activeBlock={focusedBlock}
        onFocusBlock={(block) => {
          setFocusedBlock(block);
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
      />

      <div className="detail-flow-heading">
        <span className="eyebrow">Under the hood</span>
        <h2>Detailed architecture</h2>
        <p className="muted-text">
          Same journey with contracts, services, and call paths. Click a block to
          zoom in, or play the step-by-step walkthrough below.
        </p>
      </div>

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
        totalSteps={totalSteps}
        phase={phase}
        onPlay={() => {
          if (journeyStep >= totalSteps) setJourneyStep(0);
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
