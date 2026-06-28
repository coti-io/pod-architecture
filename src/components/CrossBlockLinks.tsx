import { flowEdges } from "../data/pod-flow";

type CrossLinkPhase = "outbound" | "return" | "all";

type CrossLinkProps = {
  activeStep: number;
  phase: CrossLinkPhase;
};

const crossLinks = [
  {
    id: "cross-source-relayer",
    from: "source",
    to: "relayer",
    outboundStep: 7,
    returnStep: 21,
    outboundLabel: "MessageSent → NBE",
    returnLabel: "hot-wallet → Sepolia Inbox",
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
  if (activeStep <= 0) return null;

  return (
    <div className="cross-link-step">
      {flowEdges.find((e) => e.step === activeStep)?.label ?? ""}
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
