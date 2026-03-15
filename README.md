# TrustStream AI (Production-Oriented MVP)

TrustStream AI is a real Chrome Extension + backend pipeline for trust and scam-risk analysis on livestream commerce pages.

This MVP is built as an actual working architecture (not a static demo) and supports:
- Extension popup control flow
- In-page floating trust overlay (draggable, collapsible, shadow DOM isolation)
- Live transcript ingestion from page DOM
- Manual transcript fallback for restricted pages
- Backend session pipeline with real API endpoints
- Near-real-time state updates per chunk and SSE event stream
- Prisma + PostgreSQL persistence (with in-memory fallback for local testing)

## Monorepo Structure

```text
apps/
  extension/       # MV3 Chrome extension (popup, background, content overlay, adapters)
  server/          # Fastify API + session pipeline + Prisma persistence + SSE
packages/
  shared/          # Shared TypeScript contracts for extension/server
  ai/              # AI service wrapper (deterministic logic + optional OpenAI fallback)
  ui/              # Shared UI helpers
```

## Core Flow

1. User clicks `Start Analysis` in extension popup.
2. Background worker detects active tab + platform.
3. Background calls `POST /api/session/start`.
4. Content overlay is activated on the page.
5. Adapter extracts live DOM text chunks (captions/product text/comments where available).
6. Content script sends chunks to background (`CHUNK_DETECTED`).
7. Background posts chunks to backend `POST /api/session/:id/transcript-chunk`.
8. Backend analyzes chunk via `@truststream/ai` and updates state.
9. Background relays state to content overlay (`ANALYSIS_UPDATE`) continuously.

## Implemented APIs

- `POST /api/session/start`
- `POST /api/session/:id/transcript-chunk`
- `POST /api/session/:id/audio-chunk`
- `GET /api/session/:id/state`
- `GET /api/session/:id/events` (SSE)
- `POST /api/session/:id/stop`
- `GET /api/session/history`
- `POST /api/analyze/text`
- `POST /api/rewrite/seller-pitch`

## AI Modules (`packages/ai`)

- `detectClaims(transcriptChunk, context)`
- `classifyRiskFlags(transcriptChunk, context)`
- `matchEvidence(claims, visiblePageData, sellerData, productData)`
- `generateBuyerQuestions(claims, risks)`
- `calculateTrustScore(claims, riskFlags, sellerSignals)`
- `updateSessionSummary(existingSummary, newChunkAnalysis)`
- `rewriteSellerPitch(text)`

Behavior is deterministic by default with optional OpenAI-enhanced summary/rewrite if `OPENAI_API_KEY` is set.
With `OPENAI_API_KEY`, chunk-level claim/risk analysis is also model-assisted and merged with rule-based signals.
With `OPENAI_API_KEY` + `OPENAI_TRANSCRIBE_MODEL`, backend can transcribe captured video audio chunks for actual transcript ingestion (`audio_stt` source), when browser/page allows `video.captureStream()`.

## Persistence

`apps/server/prisma/schema.prisma` stores:
- `Session`
- `TranscriptChunk`
- `Claim`
- `RiskFlag`
- `TrustScoreHistory`
- `SummarySnapshot`

## Setup (Local Development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL (recommended)

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
```

Adjust values as needed.

### 4. Run Prisma (server)

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### 5. Start backend

```bash
pnpm dev:server
```

Server default: `http://localhost:8787`

### 6. Build extension

```bash
pnpm --filter @truststream/extension build
```

### 7. Load extension in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `apps/extension/dist`

## How Real-Time Analysis Works

- Content script extracts visible text via adapter observation.
- Each chunk is transmitted to backend through background worker.
- Backend runs analysis pipeline and updates trust state.
- Overlay is updated with:
  - trust score + label
  - live transcript feed (timestamped chunks)
  - detected claims + evidence status
  - risk flags with trigger text + reasoning
  - buyer guidance
  - rolling summary

## Supported Adapter System

Implemented adapters:
- `adapters/generic.ts`
- `adapters/tiktok.ts`
- `adapters/instagram.ts`
- `adapters/shopee.ts`

Adapter interface methods:
- `detectPage()`
- `extractVisibleText()`
- `extractProductInfo()`
- `observeDomChanges()`
- `getPlatformName()`
- `diagnostics()`

## Testing

Implemented tests:
- `packages/ai/tests/engine.test.ts` (claim detection + trust scoring + question generation)
- `apps/extension/tests/generic-adapter.test.ts` (adapter extraction)
- `apps/server/tests/session.e2e.test.ts` (session start -> chunk ingest -> stop happy path)

Run:

```bash
pnpm test
```

## Security & Privacy Notes

- Analysis begins only after user action (`Start Analysis`).
- No permanent audio storage is implemented by default.
- Transcript storage is session-scoped and persisted for history when enabled with DB.
- Data flow is extension -> backend API only for explicit session activity.

## Known Platform Limitations

- Some livestream platforms do not expose captions/text in accessible DOM.
- Cross-origin iframe content may block direct extraction.
- `tabCapture` audio capture is permission- and platform-dependent and is not fully universal.
- When extraction is restricted, overlay enters **limited visibility mode** and supports manual text input fallback.
- Exact product evidence validation still depends on what data is visible on-page.

## Production Roadmap

1. Add robust audio capture + streaming STT pipeline.
2. Add authenticated user accounts and per-user session history.
3. Add richer platform-specific adapters with selector versioning.
4. Add queue-based async AI inference and Redis buffering.
5. Add policy engine + compliance logging.
6. Add dashboard app for moderation teams.
