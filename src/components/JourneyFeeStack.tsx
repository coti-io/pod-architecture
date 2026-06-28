import { useMemo } from "react";
import { blocks, type BlockId } from "../data/pod-flow";
import {
  computeFeeBreakdown,
  defaultFeeInputs,
  formatEth,
} from "../data/fee-model";
import { FEE_SEGMENT_META, getJourneyFeeState } from "../data/fee-journey";

type JourneyFeeStackProps = {
  journeyStep: number;
  playing: boolean;
};

const BLOCK_ORDER: BlockId[] = ["source", "relayer", "coti"];

export default function JourneyFeeStack({
  journeyStep,
  playing,
}: JourneyFeeStackProps) {
  const breakdown = useMemo(
    () => computeFeeBreakdown(defaultFeeInputs()),
    [],
  );
  const state = useMemo(
    () => getJourneyFeeState(journeyStep),
    [journeyStep],
  );

  const sepoliaTxH =
    breakdown.sepoliaTxGasEth * state.sepoliaTxGasRemaining;
  const remoteH = breakdown.remoteFeeEth * state.cotiRemoteRemaining;
  const callbackH = breakdown.callbackFeeEth * state.sepoliaCallbackRemaining;
  const inboxH = remoteH + callbackH;
  const totalH = sepoliaTxH + inboxH;
  const fullTotal = breakdown.totalUserCostEth;
  const barMaxPx = 260;

  const sepoliaTxPx =
    fullTotal > 0
      ? (breakdown.sepoliaTxGasEth / fullTotal) *
        barMaxPx *
        state.sepoliaTxGasRemaining
      : 0;
  const remotePx =
    fullTotal > 0
      ? (breakdown.remoteFeeEth / fullTotal) *
        barMaxPx *
        state.cotiRemoteRemaining
      : 0;
  const callbackPx =
    fullTotal > 0
      ? (breakdown.callbackFeeEth / fullTotal) *
        barMaxPx *
        state.sepoliaCallbackRemaining
      : 0;

  const remoteFloorShare =
    breakdown.remoteFeeEth > 0
      ? breakdown.remoteFloorEth / breakdown.remoteFeeEth
      : 0;
  const callbackFloorShare =
    breakdown.callbackFeeEth > 0
      ? breakdown.callbackFloorEth / breakdown.callbackFeeEth
      : 0;
  const remoteExtraPx = remotePx * (1 - remoteFloorShare);
  const remoteFloorPx = remotePx * remoteFloorShare;
  const callbackExtraPx = callbackPx * (1 - callbackFloorShare);
  const callbackFloorPx = callbackPx * callbackFloorShare;

  const showFlow = journeyStep > 0 && state.activeBlock !== null;

  return (
    <section
      className={[
        "journey-fee-stack",
        playing ? "journey-fee-stack--playing" : "",
        journeyStep > 0 ? "journey-fee-stack--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="journey-fee-title"
    >
      <div className="journey-fee-stack__header">
        <div>
          <span className="eyebrow">Journey fees</span>
          <h2 id="journey-fee-title">Fee consumption across blocks</h2>
          <p className="fee-linked-note">
            Uses the <strong>Fee stack</strong> defaults. Changing sliders there
            does not update this animation — it is fixed so you can follow
            consumption step by step.
          </p>
        </div>
        {journeyStep > 0 && (
          <span className="journey-fee-step">
            Step {journeyStep} / 24
          </span>
        )}
      </div>

      <p className="journey-fee-label">
        {journeyStep > 0
          ? state.label
          : "Full stack — ready to deplete as each block runs."}
      </p>

      <div
        className={[
          "journey-fee-stage",
          !showFlow ? "journey-fee-stage--idle" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="journey-fee-stack-col">
          <div
            className="journey-fee-bar"
            role="img"
            aria-label="Remaining fee stack"
          >
            {inboxH > 0 && (
              <div
                className={[
                  "journey-fee-inbox",
                  state.inTransit ? "journey-fee-inbox--transit" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ height: remotePx + callbackPx }}
              >
                {remotePx > 2 && (
                  <div
                    className={[
                      "journey-fee-seg journey-fee-seg--blue-dark",
                      state.consumingSegment === "cotiRemote"
                        ? "journey-fee-seg--draining"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ height: remotePx }}
                    title={`COTI remote: ${formatEth(remoteH, 5)} remaining`}
                  >
                    {remoteExtraPx > 2 && (
                      <div
                        className="journey-fee-seg__extra journey-fee-seg__extra--remote"
                        style={{ flexGrow: 1 - remoteFloorShare || 0.001 }}
                      />
                    )}
                    {remoteFloorPx > 2 && (
                      <div
                        className="journey-fee-seg__floor journey-fee-seg__floor--remote"
                        style={{ flexGrow: remoteFloorShare || 0.001 }}
                        title={`Min floor: ${formatEth(breakdown.remoteFloorEth * state.cotiRemoteRemaining, 5)}`}
                      />
                    )}
                    <span>COTI</span>
                  </div>
                )}
                {callbackPx > 2 && (
                  <div
                    className={[
                      "journey-fee-seg journey-fee-seg--blue-light",
                      state.consumingSegment === "sepoliaCallback"
                        ? "journey-fee-seg--draining"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ height: callbackPx }}
                    title={`Callback: ${formatEth(callbackH, 5)} remaining`}
                  >
                    {callbackExtraPx > 2 && (
                      <div
                        className="journey-fee-seg__extra journey-fee-seg__extra--callback"
                        style={{ flexGrow: 1 - callbackFloorShare || 0.001 }}
                      />
                    )}
                    {callbackFloorPx > 2 && (
                      <div
                        className="journey-fee-seg__floor journey-fee-seg__floor--callback"
                        style={{ flexGrow: callbackFloorShare || 0.001 }}
                        title={`Min floor: ${formatEth(breakdown.callbackFloorEth * state.sepoliaCallbackRemaining, 5)}`}
                      />
                    )}
                    <span>Callback</span>
                  </div>
                )}
              </div>
            )}
            {sepoliaTxPx > 2 && (
              <div
                className={[
                  "journey-fee-seg journey-fee-seg--red",
                  state.consumingSegment === "sepoliaTxGas"
                    ? "journey-fee-seg--draining"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ height: sepoliaTxPx }}
                title={`Tx gas: ${formatEth(sepoliaTxH, 5)} remaining`}
              >
                <span>Tx gas</span>
              </div>
            )}
            {totalH <= 0 && journeyStep >= 24 && (
              <div className="journey-fee-empty">All consumed</div>
            )}
          </div>
          <div className="journey-fee-stack-total">
            {formatEth(totalH, 5)} left
            {journeyStep === 0 && (
              <small> of {formatEth(breakdown.totalUserCostEth, 5)}</small>
            )}
          </div>
        </div>

        {showFlow && (
          <div
            className={[
              "journey-fee-flow",
              state.inTransit ? "journey-fee-flow--transit" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            <span className="journey-fee-flow__line" />
            <span className="journey-fee-flow__dot" />
          </div>
        )}

        <div className="journey-fee-blocks">
          {BLOCK_ORDER.map((blockId) => {
            const meta = blocks.find((b) => b.id === blockId)!;
            const isActive = state.activeBlock === blockId;
            const isConsumer =
              isActive &&
              (state.consumingSegment !== null || state.inTransit);

            return (
              <div
                key={blockId}
                className={[
                  "journey-fee-block",
                  isActive ? "journey-fee-block--active" : "",
                  isConsumer ? "journey-fee-block--consuming" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ "--block-accent": meta.accent } as React.CSSProperties}
              >
                <span className="journey-fee-block__accent" />
                <strong>{meta.title}</strong>
                <span className="journey-fee-block__sub">{meta.subtitle}</span>
                {isActive && state.consumingSegment && (
                  <span className="journey-fee-block__chip">
                    {FEE_SEGMENT_META[state.consumingSegment].title}
                  </span>
                )}
                {isActive && state.inTransit && (
                  <span className="journey-fee-block__chip journey-fee-block__chip--transit">
                    In transit
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {journeyStep === 0 && !playing && (
        <p className="journey-fee-hint muted-text">
          Press <strong>Play journey</strong> or <strong>Step →</strong> to
          watch the stack deplete as each block runs.
        </p>
      )}
    </section>
  );
}
