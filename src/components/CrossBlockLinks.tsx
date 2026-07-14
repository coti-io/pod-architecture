import { getFlowDataset } from "../data/pod-flow";
import { useNetwork } from "../network/NetworkContext";

type CrossLinkPhase = "outbound" | "return" | "all";

type CrossLinkProps = {
  activeStep: number;
  phase: CrossLinkPhase;
};

function useCrossLinks() {
  const network = useNetwork();
  return [
    {
      id: "cross-source-relayer",
      from: "source",
      to: "relayer",
      outboundStep: 7,
      returnStep: 21,
      outboundLabel: "MessageSent → NBE",
      returnLabel: `hot-wallet → ${network.shortName} Inbox`,
    },
    {
      id: "cross-relayer-coti",
      from: "relayer",
      to: "coti",
      outboundStep: 10,
      returnStep: 18,
      outboundLabel: "hot-wallet → batchProcessRequests",
      returnLabel: "return MessageSent → relayer",
    },
  ] as const;
}

function CrossLinkPill({
  label,
  direction,
  active,
  compact = false,
}: {
  label: string;
  direction: "outbound" | "return";
  active: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "cross-link",
        direction === "outbound" ? "cross-link--outbound" : "cross-link--return",
        active ? "cross-link--active" : "",
        compact ? "cross-link--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="cross-link__arrow" aria-hidden />
      <span className="cross-link__label">{label}</span>
    </div>
  );
}

export function CrossBlockConnector({
  linkIndex,
  activeStep,
  phase,
}: CrossLinkProps & { linkIndex: number }) {
  const crossLinks = useCrossLinks();
  const link = crossLinks[linkIndex];
  if (!link) return null;

  const showReturn = phase === "all" || phase === "return";
  const showOutbound = phase === "all" || phase === "outbound";

  return (
    <div className="cross-block-connector" aria-hidden>
      {showOutbound && (
        <CrossLinkPill
          label={link.outboundLabel}
          direction="outbound"
          active={activeStep === link.outboundStep}
          compact
        />
      )}
      {showReturn && (
        <CrossLinkPill
          label={link.returnLabel}
          direction="return"
          active={activeStep === link.returnStep}
          compact
        />
      )}
    </div>
  );
}

export function CrossLinkStep({ activeStep }: { activeStep: number }) {
  const network = useNetwork();
  if (activeStep <= 0) return null;

  const edge =
    getFlowDataset(network).edges.find((e) => e.step === activeStep && e.crossBlock) ??
    getFlowDataset(network).edges.find((e) => e.step === activeStep);

  return (
    <div className="cross-link-step">
      {edge?.label ?? ""}
    </div>
  );
}

type CrossBlockLinksProps = CrossLinkProps & {
  layout: "horizontal" | "vertical";
};

export default function CrossBlockLinks({
  activeStep,
  phase,
  layout,
}: CrossBlockLinksProps) {
  const crossLinks = useCrossLinks();
  if (layout !== "vertical") return null;

  const showReturn = phase === "all" || phase === "return";
  const showOutbound = phase === "all" || phase === "outbound";

  return (
    <div className="cross-block-links cross-block-links--vertical" aria-hidden>
      {crossLinks.map((link) => (
        <div key={link.id} className="cross-link-group">
          {showOutbound && (
            <CrossLinkPill
              label={link.outboundLabel}
              direction="outbound"
              active={activeStep === link.outboundStep}
            />
          )}
          {showReturn && (
            <CrossLinkPill
              label={link.returnLabel}
              direction="return"
              active={activeStep === link.returnStep}
            />
          )}
        </div>
      ))}

      <CrossLinkStep activeStep={activeStep} />
    </div>
  );
}
