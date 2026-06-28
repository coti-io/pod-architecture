export type BlockId = "source" | "relayer" | "coti";
export type Phase = "outbound" | "return" | "both";

export type FlowNode = {
  id: string;
  label: string;
  subtitle?: string;
  repo?: string;
  githubPath?: string;
  block: BlockId;
  phase: Phase;
  description: string;
  signature?: string;
  position: { x: number; y: number };
  kind?: "user" | "event" | "service" | "contract";
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  phase: Phase;
  step: number;
  crossBlock?: boolean;
};

export type BlockMeta = {
  id: BlockId;
  title: string;
  subtitle: string;
  accent: string;
};

export const blocks: BlockMeta[] = [
  {
    id: "source",
    title: "Source network",
    subtitle: "Sepolia (example)",
    accent: "#0b7cff",
  },
  {
    id: "relayer",
    title: "Relayer",
    subtitle: "Off-chain services",
    accent: "#7c3aed",
  },
  {
    id: "coti",
    title: "COTI network",
    subtitle: "MPC execution chain",
    accent: "#059669",
  },
];

export const flowNodes: FlowNode[] = [
  // --- Source chain ---
  {
    id: "user",
    label: "User / dApp caller",
    block: "source",
    phase: "both",
    description:
      "An EOA or contract calls the customer dApp with encrypted inputs (itUint64) and pays inbox fees in native token.",
    signature: "MpcAdder.add(itUint64, itUint64, uint256 callbackFeeLocalWei)",
    position: { x: 20, y: 0 },
    kind: "user",
  },
  {
    id: "mpc-adder",
    label: "Customer dApp",
    subtitle: "MpcAdder.sol",
    repo: "coti-contracts",
    githubPath: "contracts/pod/examples/MpcAdder.sol",
    block: "source",
    phase: "both",
    description:
      "Example privacy dApp on the source chain. Sends an MPC add request and receives the ciphertext result via inbox callback.",
    signature: "add(...) → add64(...)",
    position: { x: 20, y: 90 },
    kind: "contract",
  },
  {
    id: "pod-lib64",
    label: "Pod contract",
    subtitle: "PodLib64.sol",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpc/PodLib64.sol",
    block: "source",
    phase: "outbound",
    description:
      "64-bit POD helpers. Builds the MPC method call and forwards it through the inbox as a two-way message.",
    signature: "add64(...) → _sendThree → _forwardTwoWay",
    position: { x: 20, y: 190 },
    kind: "contract",
  },
  {
    id: "mpc-abi-codec-src",
    label: "MpcAbiCodec",
    subtitle: "MpcAbiCodec.sol",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpccodec/MpcAbiCodec.sol",
    block: "source",
    phase: "outbound",
    description:
      "Encodes itUint64 wire types into an MpcMethodCall targeting IPodExecutor64.add64 on COTI.",
    signature: "_buildMpcThree64(selector, a, b, cOwner)",
    position: { x: 200, y: 190 },
    kind: "contract",
  },
  {
    id: "pod-lib-base",
    label: "PodLibBase",
    subtitle: "PodLibBase.sol",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpc/PodLibBase.sol",
    block: "source",
    phase: "outbound",
    description:
      "Splits callback fee from total payment and calls Inbox.sendTwoWayMessage with the encoded MPC payload.",
    signature: "_forwardTwoWay → _sendTwoWayWithFee → sendTwoWayMessage{value}",
    position: { x: 20, y: 290 },
    kind: "contract",
  },
  {
    id: "inbox-src",
    label: "Inbox",
    subtitle: "Inbox.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/Inbox.sol",
    block: "source",
    phase: "both",
    description:
      "Cross-chain message bus. Same deterministic address on every chain via CreateX. Stores outbound requests and delivers callbacks.",
    signature: "sendTwoWayMessage(...) / receiveC(bytes) onlyInbox",
    position: { x: 20, y: 390 },
    kind: "contract",
  },
  {
    id: "message-sent",
    label: "MessageSent",
    block: "source",
    phase: "outbound",
    description:
      "Event emitted when the source inbox creates an outbound request. The relayer watches for these transactions.",
    signature: "event MessageSent(bytes32 requestId, ...)",
    position: { x: 200, y: 390 },
    kind: "event",
  },
  {
    id: "receive-c",
    label: "Callback",
    subtitle: "receiveC",
    repo: "coti-contracts",
    githubPath: "contracts/pod/examples/MpcAdder.sol",
    block: "source",
    phase: "return",
    description:
      "Inbox delivers the return leg by calling the registered callback on the original sender contract.",
    signature: "receiveC(bytes data) external onlyInbox",
    position: { x: 200, y: 290 },
    kind: "contract",
  },
  {
    id: "result-store",
    label: "Result stored",
    block: "source",
    phase: "return",
    description: "MpcAdder decodes ctUint64 from the callback payload and stores it for the user to read.",
    signature: "_result = abi.decode(data, (ctUint64))",
    position: { x: 200, y: 190 },
    kind: "event",
  },

  // --- Relayer ---
  {
    id: "bs-nbe",
    label: "NBE",
    subtitle: "Chain monitor",
    repo: "bs-nbe",
    block: "relayer",
    phase: "both",
    description:
      "Watches the source chain for new inbox requests and forwards them to the relayer pipeline.",
    position: { x: 30, y: 80 },
    kind: "service",
  },
  {
    id: "cms",
    label: "CMS",
    subtitle: "Request miner",
    block: "relayer",
    phase: "both",
    description:
      "Builds batch calldata from pending requests and queues a transaction for broadcast.",
    position: { x: 30, y: 200 },
    kind: "service",
  },
  {
    id: "hot-wallet",
    label: "Hot wallet",
    subtitle: "Broadcaster",
    repo: "hot-wallet-v2",
    block: "relayer",
    phase: "both",
    description: "Signs and sends the batch transaction on the target chain.",
    position: { x: 30, y: 320 },
    kind: "service",
  },

  // --- COTI chain ---
  {
    id: "batch-process",
    label: "batchProcessRequests",
    subtitle: "InboxMiner.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/InboxMiner.sol",
    block: "coti",
    phase: "both",
    description:
      "Entry point on COTI. Only registered miners can ingest mined request payloads from a source chain and execute them in order.",
    signature: "batchProcessRequests(uint256 sourceChainId, MinedRequest[] mined)",
    position: { x: 20, y: 0 },
    kind: "contract",
  },
  {
    id: "message-received",
    label: "MessageReceived",
    block: "coti",
    phase: "outbound",
    description: "Event emitted when an incoming cross-chain request is accepted for execution on COTI.",
    signature: "event MessageReceived(bytes32 requestId, ...)",
    position: { x: 200, y: 70 },
    kind: "event",
  },
  {
    id: "execute-incoming",
    label: "_executeIncomingRequest",
    subtitle: "InboxMiner.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/InboxMiner.sol",
    block: "coti",
    phase: "outbound",
    description:
      "Encodes calldata from the MpcMethodCall, sets execution context, and subcalls the target contract with the remote gas budget.",
    signature: "_executeIncomingRequest(incomingRequest, sourceChainId)",
    position: { x: 20, y: 120 },
    kind: "contract",
  },
  {
    id: "mpc-abi-codec-coti",
    label: "MpcAbiCodec",
    subtitle: "validate + encode",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpccodec/MpcAbiCodec.sol",
    block: "coti",
    phase: "outbound",
    description:
      "Re-encodes the MPC payload into gtUint64 calldata and emits ValidateCiphertext events before the subcall.",
    signature: "_safeEncodeMethodCall(methodCall)",
    position: { x: 200, y: 190 },
    kind: "contract",
  },
  {
    id: "mpc-executor",
    label: "MpcExecutor",
    subtitle: "MpcExecutor.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/mpc/coti-side/MpcExecutor.sol",
    block: "coti",
    phase: "outbound",
    description:
      "COTI-side MPC executor. Only callable by the inbox. Routes add64 to MpcCore and responds with offboarded ciphertext.",
    signature: "add64(gtUint64, gtUint64, address cOwner) external onlyInbox",
    position: { x: 20, y: 250 },
    kind: "contract",
  },
  {
    id: "mpc-core",
    label: "MpcCore",
    subtitle: "MpcCore.sol",
    repo: "coti-contracts",
    githubPath: "contracts/utils/mpc/MpcCore.sol",
    block: "coti",
    phase: "outbound",
    description:
      "Garbled-circuit MPC primitives on COTI. Performs checkedAdd on encrypted values and offBoardCombined for the callback owner.",
    signature: "checkedAdd → offBoardCombined → ctUint64",
    position: { x: 200, y: 320 },
    kind: "contract",
  },
  {
    id: "respond",
    label: "respond",
    subtitle: "InboxBase.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/InboxBase.sol",
    block: "coti",
    phase: "outbound",
    description:
      "Target contract sends success data back through the inbox, spawning a one-way return request to the source chain.",
    signature: "respond(abi.encode(ctUint64))",
    position: { x: 20, y: 390 },
    kind: "contract",
  },
  {
    id: "send-one-way",
    label: "Return request",
    subtitle: "_sendOneWayMessage",
    repo: "pod-mpc-lib",
    githubPath: "contracts/InboxBase.sol",
    block: "coti",
    phase: "return",
    description:
      "Creates the outbound return-leg request with the callback selector and fee budget for delivery back to Sepolia.",
    signature: "_sendOneWayMessage → MessageSent (return leg)",
    position: { x: 200, y: 390 },
    kind: "event",
  },
];

export const flowEdges: FlowEdge[] = [
  // Source outbound
  { id: "e1", source: "user", target: "mpc-adder", label: "add(...)", phase: "outbound", step: 1 },
  { id: "e2", source: "mpc-adder", target: "pod-lib64", label: "add64(...)", phase: "outbound", step: 2 },
  { id: "e3", source: "pod-lib64", target: "mpc-abi-codec-src", label: "_buildMpcThree64", phase: "outbound", step: 3 },
  { id: "e4", source: "pod-lib64", target: "pod-lib-base", label: "_forwardTwoWay", phase: "outbound", step: 4 },
  { id: "e5", source: "pod-lib-base", target: "inbox-src", label: "sendTwoWayMessage{value}", phase: "outbound", step: 5 },
  { id: "e6", source: "inbox-src", target: "message-sent", label: "_createRequest → emit", phase: "outbound", step: 6 },

  // Cross: source → relayer
  { id: "e7", source: "message-sent", target: "bs-nbe", label: "MessageSent detected", phase: "outbound", step: 7, crossBlock: true },

  // Relayer outbound
  { id: "e8", source: "bs-nbe", target: "cms", label: "notify", phase: "outbound", step: 8 },
  { id: "e9", source: "cms", target: "hot-wallet", label: "queue tx", phase: "outbound", step: 9 },

  // Cross: relayer → coti
  { id: "e10", source: "hot-wallet", target: "batch-process", label: "broadcast tx", phase: "outbound", step: 10, crossBlock: true },

  // COTI outbound
  { id: "e11", source: "batch-process", target: "message-received", label: "store + emit", phase: "outbound", step: 11 },
  { id: "e12", source: "batch-process", target: "execute-incoming", label: "per request", phase: "outbound", step: 12 },
  { id: "e13", source: "execute-incoming", target: "mpc-abi-codec-coti", label: "_safeEncodeMethodCall", phase: "outbound", step: 13 },
  { id: "e14", source: "execute-incoming", target: "mpc-executor", label: "subcall add64", phase: "outbound", step: 14 },
  { id: "e15", source: "mpc-executor", target: "mpc-core", label: "checkedAdd + offBoard", phase: "outbound", step: 15 },
  { id: "e16", source: "mpc-executor", target: "respond", label: "inbox.respond(...)", phase: "outbound", step: 16 },
  { id: "e17", source: "respond", target: "send-one-way", label: "_sendOneWayMessage", phase: "outbound", step: 17 },

  // Return leg cross: coti → relayer
  { id: "e18", source: "send-one-way", target: "bs-nbe", label: "return MessageSent", phase: "return", step: 18, crossBlock: true },

  // Relayer return (same services, reverse direction label)
  { id: "e19", source: "bs-nbe", target: "cms", label: "mine return", phase: "return", step: 19 },
  { id: "e20", source: "cms", target: "hot-wallet", label: "queue return tx", phase: "return", step: 20 },

  // Cross: relayer → source return
  { id: "e21", source: "hot-wallet", target: "inbox-src", label: "batchProcessRequests", phase: "return", step: 21, crossBlock: true },

  // Source return
  { id: "e22", source: "inbox-src", target: "receive-c", label: "callback delivery", phase: "return", step: 22 },
  { id: "e23", source: "receive-c", target: "mpc-adder", label: "receiveC(bytes)", phase: "return", step: 23 },
  { id: "e24", source: "mpc-adder", target: "result-store", label: "store ctUint64", phase: "return", step: 24 },
];

export const totalJourneySteps = 24;

export function getNodeById(id: string): FlowNode | undefined {
  return flowNodes.find((n) => n.id === id);
}

export function getNodesForBlock(block: BlockId): FlowNode[] {
  return flowNodes.filter((n) => n.block === block);
}

export function getEdgesForBlock(block: BlockId, phase: Phase | "all"): FlowEdge[] {
  const nodeIds = new Set(getNodesForBlock(block).map((n) => n.id));
  const filtered = flowEdges.filter((e) => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
    if (phase === "all") return true;
    return e.phase === phase || e.phase === "both";
  });

  if (phase !== "all") return filtered;

  const seen = new Set<string>();
  return filtered.filter((e) => {
    const key = `${e.source}->${e.target}`;
    if (seen.has(key) && e.phase === "return") return false;
    seen.add(key);
    return true;
  });
}

export function getStepEdge(step: number): FlowEdge | undefined {
  return flowEdges.find((e) => e.step === step);
}

/** Maps return-leg relayer steps to outbound edges for graph highlighting in "all" phase. */
export function getDisplayEdgeId(step: number, phase: Phase | "all"): string | null {
  const edge = getStepEdge(step);
  if (!edge) return null;
  if (phase !== "all") return edge.id;
  const aliases: Record<number, string> = {
    19: "e8",
    20: "e9",
  };
  return aliases[step] ?? edge.id;
}

export function getStepTargetNode(step: number): FlowNode | undefined {
  const edge = getStepEdge(step);
  if (!edge) return undefined;
  return getNodeById(edge.target);
}

export function getGithubUrl(node: FlowNode): string | null {
  if (!node.githubPath || !node.repo) return null;
  const bases: Record<string, string> = {
    "coti-contracts": "https://github.com/coti-io/coti-contracts/blob/main",
    "pod-mpc-lib": "https://github.com/coti-io/pod-mpc-lib/blob/main",
    "bs-nbe": "https://github.com/coti-io/bs-nbe/blob/main",
    "hot-wallet-v2": "https://github.com/coti-io/hot-wallet-v2/blob/main",
  };
  const base = bases[node.repo];
  return base ? `${base}/${node.githubPath}` : null;
}
