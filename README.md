# PoD Architecture

Interactive guide to how **Privacy on Demand (PoD)** works: source chain contracts, relayer services, and COTI MPC execution.

Standalone static site — link from [pod-explorer](https://github.com/coti-io/pod-explorer) and [docs.coti.io](https://docs.coti.io).

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
