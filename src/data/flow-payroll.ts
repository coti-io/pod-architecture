import type { FlowEdge, FlowNode } from "./pod-flow";

/**
 * Avalanche Fuji example: private payroll claim via
 * https://github.com/cotitech-io/pod-dapp-ports/tree/main/sablier-payroll-pod
 *
 * Host: PayrollCampaignFacade → PayrollVault → Inbox
 * COTI: PrivatePayrollCoti.verifyAndCredit (merkle + encrypted amount match)
 */
export const payrollFlowNodes: FlowNode[] = [
  // --- Fuji host ---
  // Source layout (three lanes — avoids outbound/return overlap in All phase):
  //   left x≈20  = outbound spine
  //   mid  x≈240 = outbound helpers / MessageSent
  //   right x≈460 = return spine (bottom → top)
  {
    id: "user",
    label: "Employee / claimant",
    block: "source",
    phase: "both",
    description:
      "An employee (or allowed wallet) submits a payroll claim with an encrypted salary amount (itUint256), Merkle proof, and AVAX for inbox fees.",
    signature:
      "PayrollCampaignFacade.claim(index, recipient, itUint256, bytes32[] merkleProof)",
    position: { x: 20, y: 0 },
    kind: "user",
  },
  {
    id: "facade",
    label: "Payroll facade",
    subtitle: "PayrollCampaignFacade.sol",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/avax/PayrollCampaignFacade.sol",
    block: "source",
    phase: "outbound",
    description:
      "Sablier-shaped campaign API on Fuji. Checks campaign window, Merkle leaf, and fee, then asks the vault to request a private COTI payout verification.",
    signature: "claim(...) → _preProcessClaim → requestPayout",
    position: { x: 20, y: 100 },
    kind: "contract",
  },
  {
    id: "claim-store",
    label: "Claim store",
    subtitle: "PodClaimStore.sol",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/avax/PodClaimStore.sol",
    block: "source",
    phase: "outbound",
    description:
      "Holds the encrypted claim package (itAmount + proofHandle) prepared for the vault’s async payout request.",
    signature: "preparePayload / claim package",
    position: { x: 240, y: 100 },
    kind: "contract",
  },
  {
    id: "vault",
    label: "Payroll vault",
    subtitle: "PayrollVault.sol",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/avax/PayrollVault.sol",
    block: "source",
    phase: "outbound",
    description:
      "Fuji inbox client. Builds an MpcMethodCall targeting PrivatePayrollCoti.verifyAndCredit and sends a two-way Inbox message with fee split.",
    signature: "requestPayout → _sendTwoWayWithFee",
    position: { x: 20, y: 200 },
    kind: "contract",
  },
  {
    id: "mpc-abi-codec-src",
    label: "MpcAbiCodec",
    subtitle: "encode verifyAndCredit",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpccodec/MpcAbiCodec.sol",
    block: "source",
    phase: "outbound",
    description:
      "Encodes runId, claimant, encrypted amount, and proofHandle into an MpcMethodCall for the COTI payroll verifier.",
    signature: "create(verifyAndCredit.selector, …).build()",
    position: { x: 240, y: 200 },
    kind: "contract",
  },
  {
    id: "pod-lib-base",
    label: "PodLibBase",
    subtitle: "fee + inbox send",
    repo: "coti-contracts",
    githubPath: "contracts/pod/mpc/PodLibBase.sol",
    block: "source",
    phase: "outbound",
    description:
      "Splits callback fee from total payment and calls Inbox.sendTwoWayMessage with the encoded verifyAndCredit payload.",
    signature: "_sendTwoWayWithFee → sendTwoWayMessage{value}",
    position: { x: 20, y: 300 },
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
      "Cross-chain message bus on Fuji. Same deterministic address on every PoD chain. Stores outbound requests and delivers payroll callbacks.",
    signature: "sendTwoWayMessage(...) / onPayoutAuthorized onlyInbox",
    position: { x: 20, y: 400 },
    kind: "contract",
  },
  {
    id: "message-sent",
    label: "MessageSent",
    block: "source",
    phase: "outbound",
    description:
      "Event emitted when the Fuji inbox creates an outbound payroll verification request. The relayer watches for these transactions.",
    signature: "event MessageSent(bytes32 requestId, ...)",
    position: { x: 240, y: 400 },
    kind: "event",
  },
  {
    id: "on-payout-authorized",
    label: "Callback",
    subtitle: "onPayoutAuthorized",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/avax/PayrollVault.sol",
    block: "source",
    phase: "return",
    description:
      "Inbox delivers the return leg. The vault verifies the COTI sender, then triggers encrypted pToken payout and claim booking on the facade.",
    signature: "onPayoutAuthorized(bytes) external onlyInbox",
    position: { x: 460, y: 400 },
    kind: "contract",
  },
  {
    id: "facade-payout",
    label: "Facade payout",
    subtitle: "payoutTo + markClaimed",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/avax/PayrollCampaignFacade.sol",
    block: "source",
    phase: "return",
    description:
      "Vault calls the campaign facade to transfer encrypted pToken to the claimant and mark the Merkle index claimed.",
    signature: "payoutTo{value}(to, itAmount) + markClaimed(index)",
    position: { x: 460, y: 280 },
    kind: "contract",
  },
  {
    id: "payout-complete",
    label: "Payout complete",
    block: "source",
    phase: "return",
    description:
      "Claim settled on Fuji. Encrypted amount never appears in plaintext on the host chain.",
    signature: "PayoutCompleted(requestId, runId, index, to)",
    position: { x: 460, y: 160 },
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
      "Watches Fuji for new inbox requests and forwards them to the relayer pipeline.",
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

  // --- COTI ---
  {
    id: "batch-process",
    label: "batchProcessRequests",
    subtitle: "InboxMiner.sol",
    repo: "pod-mpc-lib",
    githubPath: "contracts/InboxMiner.sol",
    block: "coti",
    phase: "both",
    description:
      "Entry point on COTI. Registered miners ingest mined request payloads from Fuji and execute them in order.",
    signature: "batchProcessRequests(uint256 sourceChainId, MinedRequest[] mined)",
    position: { x: 20, y: 0 },
    kind: "contract",
  },
  {
    id: "message-received",
    label: "MessageReceived",
    block: "coti",
    phase: "outbound",
    description:
      "Event emitted when an incoming cross-chain payroll request is accepted for execution on COTI.",
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
      "Encodes calldata from the MpcMethodCall, sets execution context, and subcalls PrivatePayrollCoti with the remote gas budget.",
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
      "Re-encodes the claim payload into gtUint256 calldata and emits ValidateCiphertext events before the subcall.",
    signature: "_safeEncodeMethodCall(methodCall)",
    position: { x: 200, y: 190 },
    kind: "contract",
  },
  {
    id: "private-payroll",
    label: "Private payroll",
    subtitle: "PrivatePayrollCoti.sol",
    repo: "pod-dapp-ports",
    githubPath: "sablier-payroll-pod/contracts-src/coti/PrivatePayrollCoti.sol",
    block: "coti",
    phase: "outbound",
    description:
      "COTI-side payroll verifier. Checks Merkle eligibility, employee binding, and privately matches the claimed encrypted amount to the registered roster ciphertext.",
    signature: "verifyAndCredit(runId, claimant, gtUint256, proofHandle)",
    position: { x: 20, y: 250 },
    kind: "contract",
  },
  {
    id: "mpc-core",
    label: "MpcCore",
    subtitle: "eq + decrypt",
    repo: "coti-contracts",
    githubPath: "contracts/utils/mpc/MpcCore.sol",
    block: "coti",
    phase: "outbound",
    description:
      "Garbled-circuit primitives on COTI. onBoard of registered ctUint256, eq against claimed amount, decrypt of the boolean — amount never leaks.",
    signature: "onBoard → eq → decrypt",
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
      "On successful verify, PrivatePayrollCoti marks the leaf spent and responds through the inbox, spawning the return request to Fuji.",
    signature: "inbox.respond(abi.encode(runId, index, claimant))",
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
      "Creates the outbound return-leg request with the callback selector and fee budget for delivery back to Fuji.",
    signature: "_sendOneWayMessage → MessageSent (return leg)",
    position: { x: 200, y: 390 },
    kind: "event",
  },
];

export const payrollFlowEdges: FlowEdge[] = [
  // Fuji outbound — aligned to the same 24-step timing as the Sepolia MpcAdder journey
  { id: "e1", source: "user", target: "facade", label: "claim(...)", phase: "outbound", step: 1 },
  { id: "e2", source: "facade", target: "vault", label: "requestPayout", phase: "outbound", step: 2 },
  { id: "e2b", source: "facade", target: "claim-store", label: "claim package", phase: "outbound", step: 2 },
  { id: "e3", source: "vault", target: "mpc-abi-codec-src", label: "encode verifyAndCredit", phase: "outbound", step: 3 },
  { id: "e4", source: "vault", target: "pod-lib-base", label: "_sendTwoWayWithFee", phase: "outbound", step: 4 },
  { id: "e5", source: "pod-lib-base", target: "inbox-src", label: "sendTwoWayMessage{value}", phase: "outbound", step: 5 },
  { id: "e6", source: "inbox-src", target: "message-sent", label: "_createRequest → emit", phase: "outbound", step: 6 },

  // Cross: Fuji → relayer
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
  { id: "e14", source: "execute-incoming", target: "private-payroll", label: "subcall verifyAndCredit", phase: "outbound", step: 14 },
  { id: "e15", source: "private-payroll", target: "mpc-core", label: "eq amount match", phase: "outbound", step: 15 },
  { id: "e16", source: "private-payroll", target: "respond", label: "inbox.respond(...)", phase: "outbound", step: 16 },
  { id: "e17", source: "respond", target: "send-one-way", label: "_sendOneWayMessage", phase: "outbound", step: 17 },

  // Return leg cross: coti → relayer
  { id: "e18", source: "send-one-way", target: "bs-nbe", label: "return MessageSent", phase: "return", step: 18, crossBlock: true },

  { id: "e19", source: "bs-nbe", target: "cms", label: "mine return", phase: "return", step: 19 },
  { id: "e20", source: "cms", target: "hot-wallet", label: "queue return tx", phase: "return", step: 20 },

  // Cross: relayer → Fuji return
  { id: "e21", source: "hot-wallet", target: "inbox-src", label: "batchProcessRequests", phase: "return", step: 21, crossBlock: true },

  // Fuji return — stays on the right lane (no hop back across the outbound spine)
  { id: "e22", source: "inbox-src", target: "on-payout-authorized", label: "callback delivery", phase: "return", step: 22 },
  { id: "e23", source: "on-payout-authorized", target: "facade-payout", label: "payoutTo + markClaimed", phase: "return", step: 23 },
  { id: "e24", source: "facade-payout", target: "payout-complete", label: "PayoutCompleted", phase: "return", step: 24 },
];

export const payrollTotalJourneySteps = 24;
