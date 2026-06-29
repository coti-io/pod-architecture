# PoD Architecture

Interactive guide to how **Privacy on Demand (PoD)** works: source chain contracts, relayer services, and COTI MPC execution.

Standalone static site — link from [pod-explorer](https://github.com/cotitech-io/pod-explorer) and [docs.coti.io](https://docs.coti.io).

## PoD ecosystem repositories

This site maps to the repos below. They are grouped by role in the cross-chain flow (source chain → relayer → COTI → return).

### On-chain contracts

| Repository | Role |
|------------|------|
| [coti-contracts](https://github.com/coti-io/coti-contracts) | Core COTI garbled-circuit and MPC library, plus PoD dApp contracts under `contracts/pod/`: `MpcAdder`, `PodLib`, `MpcCore`, pERC20, Privacy Portal, and integration examples. |
| [coti-pod-inbox-contracts](https://github.com/coti-io/coti-pod-inbox-contracts) | Cross-chain **Inbox** implementation: message routing, miner (`batchProcessRequests`), fee manager, and `MpcAbiCodec`. Inbox-facing interfaces are synced into `coti-contracts`. |
| [pod-mpc-lib](https://github.com/coti-io/pod-mpc-lib) | **Legacy monolith** — original combined PoD contracts and Hardhat tooling. Active development is split into `coti-pod-inbox-contracts` and `coti-contracts`; use [pod-ecosystem-integration](https://github.com/coti-io/pod-ecosystem-integration) for full-stack work. |

### Relayer stack

When a `MessageSent` event fires on the source chain, three services carry the request to COTI and back:

| Repository | Abbrev | Role |
|------------|--------|------|
| [bs-nbe](https://github.com/cotitech-io/bs-nbe) | **NBE** | Monitors BlockScout (or a compatible explorer API) for Inbox transactions on the source network and posts notifications downstream. |
| [contract-manager-service](https://github.com/cotitech-io/contract-manager-service) | **CMS** | Contract Manager — receives upstream requests, applies contract-specific module logic, builds unsigned transaction payloads, and forwards them for signing. |
| [hot-wallet-v2](https://github.com/cotitech-io/hot-wallet-v2) | **Hot wallet** | Signs, broadcasts, and monitors EVM transactions; handles gas slippage, stuck-tx replacement, and status callbacks. |

### Frontend and documentation

| Repository | Role |
|------------|------|
| [pod-architecture](https://github.com/cotitech-io/pod-architecture) (this repo) | Interactive architecture guide with zoomable flow diagrams, journey playback, and fee breakdown. |
| [pod-explorer](https://github.com/cotitech-io/pod-explorer) | PoD block explorer for browsing cross-chain requests and contract activity. |
| [documentation](https://github.com/coti-io/documentation) | GitBook source for [docs.coti.io](https://docs.coti.io), including the [Privacy on Demand](https://docs.coti.io/coti-documentation/privacy-on-demand) guide. |

### Developer tooling

| Repository | Role |
|------------|------|
| [coti-sdk-pod](https://github.com/coti-io/coti-sdk-pod) | TypeScript SDK (`@coti/pod-sdk`) for PoD dApps: encrypt/decrypt helpers, async Inbox patterns, account onboarding, and contract integration docs. |
| [pod-ecosystem-integration](https://github.com/coti-io/pod-ecosystem-integration) | Multi-repo dev workspace, deploy scripts, and E2E/system tests across inbox, dApp contracts, and COTI executor flows. |

## What it shows

Three zoomable blocks:

1. **Source network** (Sepolia example) — `MpcAdder` → `PodLib64` → `Inbox` → `MessageSent`
2. **Relayer** — NBE → CMS → hot wallet
3. **COTI network** — `batchProcessRequests` → `MpcExecutor` → `MpcCore` → return leg

Click a block to focus it. Click a node to see contract details and highlighted call paths. Use **Play journey** for a step-by-step walkthrough.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5174

## Build

```bash
npm run build
npm run preview
```

## Deploy

GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and syncs `dist/` to S3 (same pattern as pod-explorer).

### GitHub configuration

Secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Repository variables:

- `AWS_REGION`
- `S3_BUCKET`
- `S3_PREFIX` (optional)
- `CLOUDFRONT_DISTRIBUTION_ID` (optional)

## Linking from other sites

### pod-explorer

Add a nav link to the deployed architecture URL, e.g.:

```tsx
<a href={import.meta.env.VITE_POD_ARCHITECTURE_URL ?? "https://pod.coti.io/how-it-works"}>
  How PoD works
</a>
```

Set `VITE_POD_ARCHITECTURE_URL` in pod-explorer CI/build when the architecture site URL is known.

### docs.coti.io

Add a documentation page that links or embeds the hosted URL (iframe or direct link).

## Example flow (MpcAdder 64-bit add)

| Step | Zone | Action |
|------|------|--------|
| 1–6 | Source | User → MpcAdder → PodLib → Inbox → MessageSent |
| 7–10 | Relayer + COTI entry | NBE → CMS → hot wallet → batchProcessRequests |
| 11–17 | COTI | Execute → MpcExecutor → MpcCore → respond → return request |
| 18–24 | Return | Relayer mines callback → MpcAdder.receiveC → result stored |

Flow data lives in [`src/data/pod-flow.ts`](src/data/pod-flow.ts).

## License

MIT
