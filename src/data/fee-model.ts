/** Mirrors InboxFeeManager fee math (simplified for UI). */

/** Sepolia `remoteMinFeeConfig.constantFee` — fixed COTI gas-unit floor. */
export const DEFAULT_REMOTE_MIN_GAS_UNITS = 12_000_000;

/** Sepolia `localMinFeeConfig` (variable callback minimum). From deployConfig chain 11155111. */
export const SEPOLIA_LOCAL_FEE_CONFIG = {
  constantFee: 0n,
  gasPerByte: 10n,
  callbackExecutionGas: 100_000n,
  errorLength: 300n,
  bufferRatioX10000: 5000n,
} as const;

/** Rough `abi.encode(methodCall).length` for MpcAdder.add64 (matches test harness default). */
export const DEFAULT_MPC_PAYLOAD_BYTES = 512;

export const DEFAULT_GAS_PRICE_GWEI = 5;
export const DEFAULT_TX_GAS_USED = 185_000;
export const DEFAULT_LOCAL_PRICE_USD = 2_500;
export const DEFAULT_REMOTE_PRICE_USD = 0.12;

export type FeeConfigTemplate = {
  constantFee: bigint;
  gasPerByte: bigint;
  callbackExecutionGas: bigint;
  errorLength: bigint;
  bufferRatioX10000: bigint;
};

export type FeeInputs = {
  gasPriceGwei: number;
  msgValueEth: number;
  callbackFeeEth: number;
  txGasUsed: number;
  localPriceUsd: number;
  remotePriceUsd: number;
  mpcPayloadBytes: number;
};

export type FeeBreakdown = {
  sepoliaTxGasWei: bigint;
  sepoliaTxGasEth: number;
  msgValueWei: bigint;
  msgValueEth: number;
  callbackFeeWei: bigint;
  callbackFeeEth: number;
  remoteFeeWei: bigint;
  remoteFeeEth: number;
  callerGasLocalUnits: bigint;
  targetGasRemoteUnits: bigint;
  localMinGasUnits: bigint;
  remoteMinGasUnits: bigint;
  remoteFloorEth: number;
  remoteHeadroomEth: number;
  callbackFloorEth: number;
  callbackHeadroomEth: number;
  meetsRemoteMinimum: boolean;
  meetsCallbackMinimum: boolean;
  totalUserCostEth: number;
  minMsgValueEthForRemoteMin: number;
  minCallbackFeeEth: number;
};

function ethToWei(eth: number): bigint {
  return BigInt(Math.round(eth * 1e18));
}

function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) return 0n;
  return (a * b) / c;
}

function mulDivCeil(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) return 0n;
  return (a * b + c - 1n) / c;
}

/** Mirrors `InboxFeeManager.expectedMinFee`. */
export function expectedMinGasUnits(
  dataSize: bigint,
  cfg: FeeConfigTemplate,
): bigint {
  if (cfg.constantFee > 0n) return cfg.constantFee;
  const base =
    dataSize * cfg.gasPerByte +
    cfg.callbackExecutionGas +
    cfg.errorLength * cfg.gasPerByte;
  return (base * (10_000n + cfg.bufferRatioX10000)) / 10_000n;
}

export function computeFeeBreakdown(input: FeeInputs): FeeBreakdown {
  const gasPriceWei = BigInt(Math.round(input.gasPriceGwei * 1e9));
  const msgValueWei = ethToWei(input.msgValueEth);
  const callbackFeeWei = ethToWei(input.callbackFeeEth);
  const sepoliaTxGasWei = gasPriceWei * BigInt(input.txGasUsed);
  const payloadBytes = BigInt(Math.max(0, input.mpcPayloadBytes));

  const remoteFeeWei =
    msgValueWei > callbackFeeWei ? msgValueWei - callbackFeeWei : 0n;

  const callerGasLocalUnits =
    gasPriceWei > 0n ? callbackFeeWei / gasPriceWei : 0n;

  const localPriceScaled = BigInt(Math.round(input.localPriceUsd * 1e14));
  const remotePriceScaled = BigInt(Math.round(input.remotePriceUsd * 1e14));

  const remoteGasLocalUnits =
    gasPriceWei > 0n ? remoteFeeWei / gasPriceWei : 0n;

  const targetGasRemoteUnits =
    remotePriceScaled > 0n
      ? mulDiv(remoteGasLocalUnits, localPriceScaled, remotePriceScaled)
      : 0n;

  const remoteMinGasUnits = BigInt(DEFAULT_REMOTE_MIN_GAS_UNITS);
  const localMinGasUnits = expectedMinGasUnits(
    payloadBytes,
    SEPOLIA_LOCAL_FEE_CONFIG,
  );

  const minRemoteGasLocalUnits =
    remotePriceScaled > 0n
      ? mulDivCeil(remoteMinGasUnits, remotePriceScaled, localPriceScaled)
      : 0n;

  const minRemoteFeeWei = minRemoteGasLocalUnits * gasPriceWei;
  const minCallbackFeeWei = localMinGasUnits * gasPriceWei;

  const remoteFloorEth = weiToEth(
    remoteFeeWei < minRemoteFeeWei ? remoteFeeWei : minRemoteFeeWei,
  );
  const remoteHeadroomEth = Math.max(
    0,
    weiToEth(remoteFeeWei) - weiToEth(minRemoteFeeWei),
  );

  const callbackFloorEth = weiToEth(
    callbackFeeWei < minCallbackFeeWei ? callbackFeeWei : minCallbackFeeWei,
  );
  const callbackHeadroomEth = Math.max(
    0,
    weiToEth(callbackFeeWei) - weiToEth(minCallbackFeeWei),
  );

  const minMsgValueEthForRemoteMin = weiToEth(
    minRemoteFeeWei + minCallbackFeeWei,
  );

  return {
    sepoliaTxGasWei,
    sepoliaTxGasEth: weiToEth(sepoliaTxGasWei),
    msgValueWei,
    msgValueEth: input.msgValueEth,
    callbackFeeWei,
    callbackFeeEth: input.callbackFeeEth,
    remoteFeeWei,
    remoteFeeEth: weiToEth(remoteFeeWei),
    callerGasLocalUnits,
    targetGasRemoteUnits,
    localMinGasUnits,
    remoteMinGasUnits,
    remoteFloorEth,
    remoteHeadroomEth,
    callbackFloorEth,
    callbackHeadroomEth,
    meetsRemoteMinimum: targetGasRemoteUnits >= remoteMinGasUnits,
    meetsCallbackMinimum: callerGasLocalUnits >= localMinGasUnits,
    totalUserCostEth: weiToEth(sepoliaTxGasWei + msgValueWei),
    minMsgValueEthForRemoteMin,
    minCallbackFeeEth: weiToEth(minCallbackFeeWei),
  };
}

export function defaultFeeInputs(
  localPriceUsd: number = DEFAULT_LOCAL_PRICE_USD,
): FeeInputs {
  const gasPriceGwei = DEFAULT_GAS_PRICE_GWEI;
  const gasPriceWei = BigInt(Math.round(gasPriceGwei * 1e9));
  const mpcPayloadBytes = DEFAULT_MPC_PAYLOAD_BYTES;

  const localPriceScaled = BigInt(Math.round(localPriceUsd * 1e14));
  const remotePriceScaled = BigInt(Math.round(DEFAULT_REMOTE_PRICE_USD * 1e14));

  const localMinGasUnits = expectedMinGasUnits(
    BigInt(mpcPayloadBytes),
    SEPOLIA_LOCAL_FEE_CONFIG,
  );
  const minCallbackFeeWei = localMinGasUnits * gasPriceWei;

  const minRemoteGasLocalUnits = mulDivCeil(
    BigInt(DEFAULT_REMOTE_MIN_GAS_UNITS),
    remotePriceScaled,
    localPriceScaled,
  );
  const minRemoteFeeWei = minRemoteGasLocalUnits * gasPriceWei;

  const msgValueEth =
    weiToEth(minRemoteFeeWei + minCallbackFeeWei) * 1.05;
  const callbackFeeEth = weiToEth(minCallbackFeeWei) * 1.02;

  return {
    gasPriceGwei,
    msgValueEth: Math.round(msgValueEth * 1e6) / 1e6,
    callbackFeeEth: Math.round(callbackFeeEth * 1e6) / 1e6,
    txGasUsed: DEFAULT_TX_GAS_USED,
    localPriceUsd,
    remotePriceUsd: DEFAULT_REMOTE_PRICE_USD,
    mpcPayloadBytes,
  };
}

export function formatNative(
  value: number,
  symbol: string,
  digits = 6,
): string {
  if (value === 0) return `0 ${symbol}`;
  if (value < 0.000001) return `${(value * 1e9).toFixed(2)} gwei`;
  return `${value.toFixed(digits)} ${symbol}`;
}

/** @deprecated Prefer formatNative(value, symbol). */
export function formatEth(value: number, digits = 6): string {
  return formatNative(value, "ETH", digits);
}

export function formatGasUnits(value: bigint): string {
  return value.toLocaleString("en-US");
}
