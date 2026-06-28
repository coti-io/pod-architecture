type JourneyControlsProps = {
  playing: boolean;
  step: number;
  totalSteps: number;
  phase: "outbound" | "return" | "all";
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onPhaseChange: (phase: "outbound" | "return" | "all") => void;
};

export default function JourneyControls({
  playing,
  step,
  totalSteps,
  phase,
  onPlay,
  onPause,
  onStep,
  onReset,
  onPhaseChange,
}: JourneyControlsProps) {
  return (
    <div className="journey-controls">
      <div className="journey-controls__playback">
        {playing ? (
          <button type="button" className="primary-btn" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" className="primary-btn" onClick={onPlay}>
            Play journey
          </button>
        )}
        <button type="button" className="ghost-btn" onClick={onStep} disabled={step >= totalSteps}>
          Step →
        </button>
        <button type="button" className="ghost-btn" onClick={onReset}>
          Reset
        </button>
        <span className="journey-controls__counter">
          {step > 0 ? step : "—"} / {totalSteps}
        </span>
      </div>

      <div className="journey-controls__phase" role="group" aria-label="Phase filter">
        {(["all", "outbound", "return"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={["phase-btn", phase === p ? "phase-btn--active" : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onPhaseChange(p)}
          >
            {p === "all" ? "Full flow" : p === "outbound" ? "Outbound" : "Return leg"}
          </button>
        ))}
      </div>
    </div>
  );
}
