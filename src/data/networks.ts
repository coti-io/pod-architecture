export type NetworkId = "sepolia" | "fuji";

/** High-level “for dummies” stage — no internal contract detail. */
export type DummyFlowStage = {
  id: string;
  title: string;
  subtitle: string;
  blurb: string;
  accent: string;
  /** Maps click → detailed block focus, when applicable. */
  focusBlock?: "source" | "relayer" | "coti";
};

export type NetworkProfile = {
  id: NetworkId;
  /** URL path segment used for this brand (empty = root). */
  pathSegment: string;
  shortName: string;
  displayName: string;
  nativeSymbol: string;
  chainId: number;
  heroTag: string;
  heroTitle: string;
  heroLead: string;
  docsHref: string;
  docsLabel: string;
  /** Live PoD message explorer (testnet). */
  explorerHref: string;
  explorerLabel: string;
  sourceBlockSubtitle: string;
  sourceAccent: string;
  themeClass: string;
  defaultLocalPriceUsd: number;
  pageTitle: string;
  pageDescription: string;
  /** Word/phrase bolded in the hero lead. */
  heroEmphasis: string;
  /** Short call name used in fee-stack copy. */
  exampleCallLabel: string;
  /** High-level story strip above the detailed architecture. */
  dummyFlow: DummyFlowStage[];
  /** Example repo link shown in the hero (optional). */
  exampleRepoHref?: string;
  exampleRepoLabel?: string;
  /** Optional peer page for network switcher (omit to hide). */
  alternate?: {
    href: string;
    label: string;
  };
};

export const SEPOLIA_NETWORK: NetworkProfile = {
  id: "sepolia",
  pathSegment: "",
  shortName: "Sepolia",
  displayName: "Ethereum Sepolia",
  nativeSymbol: "ETH",
  chainId: 11155111,
  heroTag: "Privacy on Demand",
  heroTitle: "How PoD works",
  heroLead:
    "Follow an encrypted MpcAdder request from Sepolia through the relayer stack to COTI MPC execution and back.",
  heroEmphasis: "MpcAdder",
  exampleCallLabel: "MpcAdder.add",
  docsHref: "https://docs.coti.io/coti-documentation/privacy-on-demand",
  docsLabel: "Privacy on Demand documentation",
  explorerHref: "https://testnet.explorer.pod.coti.io",
  explorerLabel: "Testnet PoD Explorer",
  sourceBlockSubtitle: "Sepolia (example)",
  sourceAccent: "#0b7cff",
  themeClass: "",
  defaultLocalPriceUsd: 2_500,
  pageTitle: "How PoD Works — COTI",
  pageDescription:
    "Interactive guide to how Privacy on Demand (PoD) works across source chains, relayers, and COTI.",
  dummyFlow: [
    {
      id: "dapp",
      title: "dApp",
      subtitle: "MpcAdder",
      blurb: "Your app takes encrypted inputs and starts a private request.",
      accent: "#0b7cff",
      focusBlock: "source",
    },
    {
      id: "host",
      title: "Sepolia",
      subtitle: "Host chain",
      blurb: "Contracts + Inbox live here — they hold fees and wait for the reply.",
      accent: "#2563eb",
      focusBlock: "source",
    },
    {
      id: "relayer",
      title: "Relayer",
      subtitle: "Courier",
      blurb: "Off-chain services move the sealed request to COTI and back.",
      accent: "#7c3aed",
      focusBlock: "relayer",
    },
    {
      id: "coti",
      title: "COTI",
      subtitle: "Private compute",
      blurb: "Sensitive math runs privately; only encrypted results come back.",
      accent: "#059669",
      focusBlock: "coti",
    },
  ],
  alternate: {
    href: "./avalanche/",
    label: "Avalanche Fuji C-Chain",
  },
};

export const FUJI_NETWORK: NetworkProfile = {
  id: "fuji",
  pathSegment: "avalanche",
  shortName: "Fuji",
  displayName: "Avalanche Fuji C-Chain",
  nativeSymbol: "AVAX",
  chainId: 43113,
  heroTag: "PoD on Avalanche",
  heroTitle: "How PoD works on Fuji",
  heroLead:
    "Follow a private payroll claim from Avalanche Fuji C-Chain through the relayer stack — encrypted amounts verified on COTI, then paid out on Fuji.",
  heroEmphasis: "payroll claim",
  exampleCallLabel: "PayrollCampaignFacade.claim",
  exampleRepoHref:
    "https://github.com/cotitech-io/pod-dapp-ports/tree/main/sablier-payroll-pod",
  exampleRepoLabel: "Sablier payroll PoD example",
  docsHref:
    "https://docs.coti.io/coti-documentation/privacy-on-demand/networks/fuji",
  docsLabel: "Avalanche Fuji network docs",
  explorerHref: "https://testnet.explorer.pod.coti.io",
  explorerLabel: "Testnet PoD Explorer",
  sourceBlockSubtitle: "Fuji C-Chain (host)",
  sourceAccent: "#E84142",
  themeClass: "theme-avalanche",
  defaultLocalPriceUsd: 35,
  pageTitle: "How PoD Works on Fuji — Avalanche × COTI",
  pageDescription:
    "Interactive guide to Privacy on Demand (PoD) private payroll on Avalanche Fuji C-Chain: claim, COTI verification, and encrypted payout.",
  dummyFlow: [
    {
      id: "dapp",
      title: "dApp",
      subtitle: "Payroll management",
      blurb: "An employee claims pay with an encrypted amount — no salary in the clear.",
      accent: "#E84142",
      focusBlock: "source",
    },
    {
      id: "host",
      title: "Fuji C-Chain",
      subtitle: "Host chain",
      blurb: "Your payroll contracts and Inbox live here on Avalanche Fuji.",
      accent: "#c23435",
      focusBlock: "source",
    },
    {
      id: "relayer",
      title: "Relayer",
      subtitle: "Courier",
      blurb: "Off-chain services carry the sealed claim to COTI and ferry the reply.",
      accent: "#7c3aed",
      focusBlock: "relayer",
    },
    {
      id: "coti",
      title: "COTI",
      subtitle: "Private compute",
      blurb: "Verifies the claim privately, then sends an encrypted payout go-ahead back.",
      accent: "#059669",
      focusBlock: "coti",
    },
  ],
};

export const NETWORKS: Record<NetworkId, NetworkProfile> = {
  sepolia: SEPOLIA_NETWORK,
  fuji: FUJI_NETWORK,
};

/** Resolve brand from the current URL (supports deploy under a path prefix). */
export function resolveNetworkFromPathname(
  pathname: string = typeof window !== "undefined" ? window.location.pathname : "/",
): NetworkProfile {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (
    normalized.endsWith("/avalanche") ||
    normalized.includes("/avalanche/")
  ) {
    return FUJI_NETWORK;
  }
  return SEPOLIA_NETWORK;
}
