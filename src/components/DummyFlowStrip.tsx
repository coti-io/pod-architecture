import type { BlockId } from "../data/pod-flow";
import { useNetwork } from "../network/NetworkContext";

type DummyFlowStripProps = {
  activeBlock: BlockId | null;
  onFocusBlock: (block: BlockId) => void;
};

export default function DummyFlowStrip({
  activeBlock,
  onFocusBlock,
}: DummyFlowStripProps) {
  const network = useNetwork();
  const stages = network.dummyFlow;

  return (
    <section className="dummy-flow" aria-labelledby="dummy-flow-title">
      <div className="dummy-flow__header">
        <span className="eyebrow">Flow for dummies</span>
        <h2 id="dummy-flow-title">The big picture</h2>
        <p>
          Four stops — no contracts, no gas math. A sealed request leaves your
          dApp, rides the host chain and relayer, gets answered on COTI, then
          comes back.
        </p>
      </div>

      <ol className="dummy-flow__track">
        {stages.map((stage, index) => {
          const focusable = Boolean(stage.focusBlock);
          const active =
            stage.focusBlock != null && stage.focusBlock === activeBlock;

          return (
            <li key={stage.id} className="dummy-flow__item">
              {index > 0 && (
                <span className="dummy-flow__arrow" aria-hidden>
                  →
                </span>
              )}
              <button
                type="button"
                className={[
                  "dummy-flow__card",
                  active ? "dummy-flow__card--active" : "",
                  focusable ? "" : "dummy-flow__card--static",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ "--stage-accent": stage.accent } as React.CSSProperties}
                onClick={() => {
                  if (stage.focusBlock) onFocusBlock(stage.focusBlock);
                }}
                disabled={!focusable}
                aria-pressed={active}
              >
                <span className="dummy-flow__index" aria-hidden>
                  {index + 1}
                </span>
                <strong className="dummy-flow__title">{stage.title}</strong>
                <span className="dummy-flow__subtitle">{stage.subtitle}</span>
                <span className="dummy-flow__blurb">{stage.blurb}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="dummy-flow__return muted-text">
        Return path: <strong>COTI → Relayer → {network.shortName} → dApp</strong>
      </p>
    </section>
  );
}
