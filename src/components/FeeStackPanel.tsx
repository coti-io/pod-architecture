import { useMemo, useState } from "react";
import {
  DEFAULT_REMOTE_MIN_GAS_UNITS,
  computeFeeBreakdown,
  defaultFeeInputs,
  formatEth,
  formatGasUnits,
  type FeeInputs,
} from "../data/fee-model";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function FeeStackPanel() {
  const [inputs, setInputs] = useState<FeeInputs>(defaultFeeInputs);
  const [expanded, setExpanded] = useState(false);
  const [blueExpanded, setBlueExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const breakdown = useMemo(() => computeFeeBreakdown(inputs), [inputs]);

  const totalEth = breakdown.totalUserCostEth;
  const redPct = totalEth > 0 ? (breakdown.sepoliaTxGasEth / totalEth) * 100 : 0;
  const bluePct = totalEth > 0 ? (breakdown.msgValueEth / totalEth) * 100 : 0;

  const callbackPctInBlue =
    breakdown.msgValueEth > 0
      ? (breakdown.callbackFeeEth / breakdown.msgValueEth) * 100
      : 0;
  const remotePctInBlue = 100 - callbackPctInBlue;

  const remoteFloorShare =
    breakdown.remoteFeeEth > 0
      ? breakdown.remoteFloorEth / breakdown.remoteFeeEth
      : 0;
  const callbackFloorShare =
    breakdown.callbackFeeEth > 0
      ? breakdown.callbackFloorEth / breakdown.callbackFeeEth
      : 0;

  const patch = (partial: Partial<FeeInputs>) =>
    setInputs((prev) => ({ ...prev, ...partial }));

  return (
    <section
      className={[
        "fee-stack-panel",
        expanded ? "fee-stack-panel--expanded" : "fee-stack-panel--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="fee-stack-title"
    >
      <button
        type="button"
        className="fee-stack-panel__header fee-stack-panel__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="fee-stack-body"
      >
        <div className="fee-stack-panel__header-main">
          <span className="fee-stack-panel__chevron" aria-hidden />
          <div>
            <span className="eyebrow">Fee stack</span>
            <h2 id="fee-stack-title">What the user pays on Sepolia</h2>
            {expanded && (
              <p className="fee-stack-panel__intro">
                One vertical stack:{" "}
                <span className="fee-legend-inline">
                  <span className="fee-legend fee-legend--red" aria-hidden />
                  <strong>red</strong>
                </span>{" "}
                is Sepolia gas to submit the tx;{" "}
                <span className="fee-legend-inline">
                  <span className="fee-legend fee-legend--blue" aria-hidden />
                  <strong>blue</strong>
                </span>{" "}
                is{" "}
                <code>msg.value</code> reserved for COTI execution and the return
                callback. Striped bands are <strong>Inbox minimum floors</strong>;
                solid bands above them are optional headroom. Sliders below are
                for exploration only — they do not change Journey fees above.
              </p>
            )}
            {!expanded && (
              <p className="fee-stack-panel__intro fee-stack-panel__intro--collapsed">
                Explore fee composition — defaults match Journey fees above;
                sliders here do not affect the journey animation.
              </p>
            )}
          </div>
        </div>
        <div className="fee-stack-panel__total">
          <span className="fee-stack-panel__total-label">Total cost</span>
          <strong>{formatEth(breakdown.totalUserCostEth, 5)}</strong>
          <span className="muted-text">@ {inputs.gasPriceGwei} gwei</span>
        </div>
      </button>

      {expanded && (
      <div id="fee-stack-body" className="fee-stack-layout">
        <div className="fee-stack-visual">
          <div className="fee-stack-bar" role="img" aria-label="Fee stack breakdown">
            {bluePct > 0 && (
              <button
                type="button"
                className="fee-stack-segment fee-stack-segment--blue"
                style={{ flexGrow: bluePct }}
                onClick={() => setBlueExpanded((v) => !v)}
                aria-expanded={blueExpanded}
                title="Click to expand inbox reserve"
              >
                <span className="fee-stack-segment__label">
                  Inbox reserve
                  <small>{formatEth(breakdown.msgValueEth, 5)}</small>
                </span>
                {blueExpanded && (
                  <div className="fee-stack-sub">
                    <div
                      className="fee-stack-sub__remote"
                      style={{ flexGrow: remotePctInBlue }}
                    >
                      <span className="fee-stack-sub__title">COTI execution</span>
                      <small>{formatEth(breakdown.remoteFeeEth, 5)}</small>
                      <div className="fee-stack-sub__split">
                        <div
                          className="fee-stack-sub__floor fee-stack-sub__floor--remote"
                          style={{ flexGrow: remoteFloorShare || 0.001 }}
                          title={`Inbox floor: ${formatGasUnits(breakdown.remoteMinGasUnits)} gas units`}
                        >
                          <span>Min 12M</span>
                          <small>{formatEth(breakdown.remoteFloorEth, 5)}</small>
                        </div>
                        {breakdown.remoteHeadroomEth > 0 && (
                          <div
                            className="fee-stack-sub__extra fee-stack-sub__extra--remote"
                            style={{
                              flexGrow: 1 - remoteFloorShare || 0.001,
                            }}
                            title="Extra headroom for heavier MPC"
                          >
                            <span>Extra</span>
                            <small>
                              {formatEth(breakdown.remoteHeadroomEth, 5)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="fee-stack-sub__callback"
                      style={{ flexGrow: callbackPctInBlue }}
                    >
                      <span className="fee-stack-sub__title">Sepolia callback</span>
                      <small>{formatEth(breakdown.callbackFeeEth, 5)}</small>
                      <div className="fee-stack-sub__split">
                        <div
                          className="fee-stack-sub__floor fee-stack-sub__floor--callback"
                          style={{ flexGrow: callbackFloorShare || 0.001 }}
                          title={`Template minimum: ${formatGasUnits(breakdown.localMinGasUnits)} gas units`}
                        >
                          <span>Min</span>
                          <small>{formatEth(breakdown.callbackFloorEth, 5)}</small>
                        </div>
                        {breakdown.callbackHeadroomEth > 0 && (
                          <div
                            className="fee-stack-sub__extra fee-stack-sub__extra--callback"
                            style={{
                              flexGrow: 1 - callbackFloorShare || 0.001,
                            }}
                            title="Extra callback gas budget"
                          >
                            <span>Extra</span>
                            <small>
                              {formatEth(breakdown.callbackHeadroomEth, 5)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            )}
            {redPct > 0 && (
              <div
                className="fee-stack-segment fee-stack-segment--red"
                style={{ flexGrow: redPct }}
              >
                <span className="fee-stack-segment__label">
                  Sepolia tx gas
                  <small>{formatEth(breakdown.sepoliaTxGasEth, 5)}</small>
                </span>
              </div>
            )}
          </div>

          <ul className="fee-stack-legend">
            <li>
              <span className="fee-legend fee-legend--red" aria-hidden />
              <span className="fee-stack-legend__label">
                Sepolia network — pays validators for broadcasting{" "}
                <code>MpcAdder.add</code>
              </span>
            </li>
            <li>
              <span className="fee-legend fee-legend--blue" aria-hidden />
              <span className="fee-stack-legend__label">
                Inbox — held on Sepolia Inbox; not spent as gas at send time
              </span>
            </li>
            <li>
              <span className="fee-legend fee-legend--blue-dark" aria-hidden />
              <span className="fee-stack-legend__label">
                Remote slice → oracle → COTI gas budget
              </span>
            </li>
            <li>
              <span className="fee-legend fee-legend--blue-light" aria-hidden />
              <span className="fee-stack-legend__label">
                Callback slice → Sepolia return leg
              </span>
            </li>
            <li>
              <span className="fee-legend fee-legend--floor" aria-hidden />
              <span className="fee-stack-legend__label">
                Inbox minimum floor — 12M COTI gas units or local callback
                template
              </span>
            </li>
            <li>
              <span className="fee-legend fee-legend--extra" aria-hidden />
              <span className="fee-stack-legend__label">
                Optional headroom above minimum
              </span>
            </li>
          </ul>
        </div>

        <div className="fee-stack-details">
          <div className="fee-oracle-card">
            <h3>Inbox minimum floors (Sepolia Inbox)</h3>
            <p className="muted-text">
              The Inbox rejects underpayment via <code>TargetFeeTooLow</code> /{" "}
              <code>CallbackFeeTooLow</code>. Floors are in gas units; the UI converts
              them to ETH using your gas price and oracle ratio.
            </p>
            <dl className="fee-dl">
              <div>
                <dt>COTI remote floor</dt>
                <dd>
                  {formatGasUnits(breakdown.remoteMinGasUnits)} gas units
                  <span className="fee-dl__sub">
                    ≈ {formatEth(breakdown.remoteFloorEth, 5)} of remote slice
                  </span>
                </dd>
              </div>
              <div>
                <dt>Callback local floor</dt>
                <dd>
                  {formatGasUnits(breakdown.localMinGasUnits)} gas units
                  <span className="fee-dl__sub">
                    ≈ {formatEth(breakdown.callbackFloorEth, 5)} min callback slice
                  </span>
                </dd>
              </div>
              <div>
                <dt>Payload size (estimate)</dt>
                <dd>{inputs.mpcPayloadBytes} bytes</dd>
              </div>
              <div>
                <dt>Your remote budget</dt>
                <dd className={breakdown.meetsRemoteMinimum ? "fee-ok" : "fee-warn"}>
                  {formatGasUnits(breakdown.targetGasRemoteUnits)} gas units
                </dd>
              </div>
            </dl>
          </div>

          <div className="fee-oracle-card">
            <h3>Oracle conversion (remote slice)</h3>
            <p className="muted-text">
              Remote wei is converted to COTI gas units using cached USD prices per wei.
            </p>
            <dl className="fee-dl">
              <div>
                <dt>Sepolia ETH price</dt>
                <dd>${inputs.localPriceUsd.toLocaleString()}</dd>
              </div>
              <div>
                <dt>COTI native price</dt>
                <dd>${inputs.remotePriceUsd}</dd>
              </div>
              <div>
                <dt>→ targetGasRemoteUnits</dt>
                <dd className={breakdown.meetsRemoteMinimum ? "fee-ok" : "fee-warn"}>
                  {formatGasUnits(breakdown.targetGasRemoteUnits)}
                </dd>
              </div>
              <div>
                <dt>Inbox minimum (default)</dt>
                <dd>{formatGasUnits(BigInt(DEFAULT_REMOTE_MIN_GAS_UNITS))}</dd>
              </div>
            </dl>
            {!breakdown.meetsRemoteMinimum && (
              <p className="fee-warn-msg">
                Remote below floor — inbox would revert{" "}
                <code>TargetFeeTooLow</code>. Need at least{" "}
                {formatEth(breakdown.minMsgValueEthForRemoteMin, 5)} in{" "}
                <code>msg.value</code> (incl. callback min).
              </p>
            )}
            {breakdown.meetsRemoteMinimum && !breakdown.meetsCallbackMinimum && (
              <p className="fee-warn-msg">
                Callback below local template minimum — would revert{" "}
                <code>CallbackFeeTooLow</code>. Need callback slice ≥{" "}
                {formatEth(breakdown.minCallbackFeeEth, 5)}.
              </p>
            )}
            {breakdown.meetsRemoteMinimum && breakdown.meetsCallbackMinimum && (
              <p className="fee-ok-msg">
                Meets both floors. Striped = required minimum; solid extra = headroom
                dApps can add for heavier MPC or larger callbacks.
              </p>
            )}
          </div>

          <div className="fee-controls">
            <label className="fee-control">
              <span>Gas price (gwei)</span>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={inputs.gasPriceGwei}
                onChange={(e) =>
                  patch({ gasPriceGwei: Number(e.target.value) })
                }
              />
              <output>{inputs.gasPriceGwei} gwei</output>
            </label>

            <label className="fee-control">
              <span>
                <code>msg.value</code> (ETH)
              </span>
              <input
                type="range"
                min={0.0001}
                max={0.05}
                step={0.0001}
                value={inputs.msgValueEth}
                onChange={(e) =>
                  patch({ msgValueEth: Number(e.target.value) })
                }
              />
              <output>{formatEth(inputs.msgValueEth, 5)}</output>
            </label>

            <label className="fee-control">
              <span>Callback fee slice (ETH)</span>
              <input
                type="range"
                min={0.00001}
                max={clamp(inputs.msgValueEth * 0.8, 0.00001, 0.02)}
                step={0.00001}
                value={Math.min(inputs.callbackFeeEth, inputs.msgValueEth)}
                onChange={(e) =>
                  patch({
                    callbackFeeEth: Math.min(
                      Number(e.target.value),
                      inputs.msgValueEth,
                    ),
                  })
                }
              />
              <output>{formatEth(breakdown.callbackFeeEth, 5)}</output>
            </label>

            <button
              type="button"
              className="ghost-btn fee-advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Hide" : "Show"} oracle & tx gas
            </button>

            {showAdvanced && (
              <>
                <label className="fee-control">
                  <span>Tx gas used (estimate)</span>
                  <input
                    type="range"
                    min={120_000}
                    max={400_000}
                    step={5_000}
                    value={inputs.txGasUsed}
                    onChange={(e) =>
                      patch({ txGasUsed: Number(e.target.value) })
                    }
                  />
                  <output>{inputs.txGasUsed.toLocaleString()}</output>
                </label>
                <label className="fee-control">
                  <span>ETH/USD (oracle local)</span>
                  <input
                    type="range"
                    min={1000}
                    max={5000}
                    step={50}
                    value={inputs.localPriceUsd}
                    onChange={(e) =>
                      patch({ localPriceUsd: Number(e.target.value) })
                    }
                  />
                  <output>${inputs.localPriceUsd}</output>
                </label>
                <label className="fee-control">
                  <span>COTI/USD (oracle remote)</span>
                  <input
                    type="range"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={inputs.remotePriceUsd}
                    onChange={(e) =>
                      patch({ remotePriceUsd: Number(e.target.value) })
                    }
                  />
                  <output>${inputs.remotePriceUsd.toFixed(2)}</output>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
