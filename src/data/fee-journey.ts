import type { BlockId } from "./pod-flow";
import { totalJourneySteps } from "./pod-flow";

export type FeeSegmentId = "sepoliaTxGas" | "cotiRemote" | "sepoliaCallback";

export type JourneyFeeState = {
  /** 0 = fully consumed, 1 = full */
  sepoliaTxGasRemaining: number;
  cotiRemoteRemaining: number;
  sepoliaCallbackRemaining: number;
  activeBlock: BlockId | null;
  consumingSegment: FeeSegmentId | null;
  label: string;
  inTransit: boolean;
};

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

function remoteDrainProgress(step: number): number {
  if (step < 10) return 1;
  if (step >= 17) return 0;
  return lerp(1, 0, (step - 10) / 6);
}

function callbackDrainProgress(step: number): number {
  if (step < 22) return 1;
  if (step >= 24) return 0;
  return lerp(1, 0, (step - 22) / 2);
}

function sepoliaTxGasRemaining(step: number): number {
  if (step <= 0) return 1;
  if (step === 1) return 0.85;
  if (step <= 4) return lerp(0.85, 0.2, (step - 1) / 3);
  if (step === 5) return 0.08;
  return 0;
}

export function getJourneyFeeState(step: number): JourneyFeeState {
  const clamped = Math.max(0, Math.min(step, totalJourneySteps));

  if (clamped === 0) {
    return {
      sepoliaTxGasRemaining: 1,
      cotiRemoteRemaining: 1,
      sepoliaCallbackRemaining: 1,
      activeBlock: null,
      consumingSegment: null,
      label: "Full stack — press Play journey to watch each block consume its share.",
      inTransit: false,
    };
  }

  const red = sepoliaTxGasRemaining(clamped);
  const remote = remoteDrainProgress(clamped);
  const callback = callbackDrainProgress(clamped);

  if (clamped <= 6) {
    const labels: Record<number, string> = {
      1: "Sepolia — user submits MpcAdder.add with msg.value",
      2: "Sepolia — PodLib encodes the MPC call",
      3: "Sepolia — calldata prepared for COTI",
      4: "Sepolia — forwarding to Inbox",
      5: "Sepolia — sendTwoWayMessage: red (tx gas) paid to network",
      6: "Sepolia — MessageSent; blue reserve locked in Inbox",
    };
    return {
      sepoliaTxGasRemaining: red,
      cotiRemoteRemaining: remote,
      sepoliaCallbackRemaining: callback,
      activeBlock: "source",
      consumingSegment: clamped >= 5 ? "sepoliaTxGas" : null,
      label: labels[clamped] ?? "Sepolia — preparing request",
      inTransit: false,
    };
  }

  if (clamped <= 9) {
    const labels: Record<number, string> = {
      7: "Relayer — NBE picks up MessageSent",
      8: "Relayer — CMS prepares batch",
      9: "Relayer — hot wallet broadcasts to COTI",
    };
    return {
      sepoliaTxGasRemaining: red,
      cotiRemoteRemaining: remote,
      sepoliaCallbackRemaining: callback,
      activeBlock: "relayer",
      consumingSegment: null,
      label: labels[clamped] ?? "Relayer — mining in progress",
      inTransit: true,
    };
  }

  if (clamped <= 17) {
    const labels: Record<number, string> = {
      10: "COTI — batchProcessRequests ingests the request",
      11: "COTI — MessageReceived stored",
      12: "COTI — executing incoming request",
      13: "COTI — validating ciphertext",
      14: "COTI — MpcExecutor.add64 subcall",
      15: "COTI — MpcCore checkedAdd (remote gas budget consumed)",
      16: "COTI — respond creates return-leg request",
      17: "COTI — remote slice fully spent; callback still reserved on Sepolia",
    };
    return {
      sepoliaTxGasRemaining: red,
      cotiRemoteRemaining: remote,
      sepoliaCallbackRemaining: callback,
      activeBlock: "coti",
      consumingSegment: clamped >= 12 ? "cotiRemote" : null,
      label: labels[clamped] ?? "COTI — MPC execution",
      inTransit: false,
    };
  }

  if (clamped <= 21) {
    const labels: Record<number, string> = {
      18: "Relayer — return request detected",
      19: "Relayer — CMS mines return leg",
      20: "Relayer — hot wallet broadcasts to Sepolia",
      21: "Sepolia — return request received by Inbox",
    };
    return {
      sepoliaTxGasRemaining: red,
      cotiRemoteRemaining: remote,
      sepoliaCallbackRemaining: callback,
      activeBlock: clamped >= 21 ? "source" : "relayer",
      consumingSegment: null,
      label: labels[clamped] ?? "Return leg in transit",
      inTransit: true,
    };
  }

  const labels: Record<number, string> = {
    22: "Sepolia — Inbox delivers receiveC callback",
    23: "Sepolia — callback gas consumed; result stored",
    24: "Complete — all user-paid segments consumed",
  };

  return {
    sepoliaTxGasRemaining: red,
    cotiRemoteRemaining: remote,
    sepoliaCallbackRemaining: callback,
    activeBlock: "source",
    consumingSegment: clamped <= 23 ? "sepoliaCallback" : null,
    label: labels[clamped] ?? "Sepolia — callback delivery",
    inTransit: false,
  };
}

export const FEE_SEGMENT_META: Record<
  FeeSegmentId,
  { title: string; colorClass: string; subClass?: string }
> = {
  sepoliaTxGas: { title: "Sepolia tx gas", colorClass: "journey-fee-seg--red" },
  cotiRemote: {
    title: "COTI execution",
    colorClass: "journey-fee-seg--blue-dark",
  },
  sepoliaCallback: {
    title: "Sepolia callback",
    colorClass: "journey-fee-seg--blue-light",
  },
};
