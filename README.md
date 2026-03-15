# TrustStream AI MVP

TrustStream AI is a demo-ready web prototype for livestream commerce trust and scam prevention in ASEAN.

It helps:
- Buyers detect risky claims during livestream shopping.
- Sellers improve pitch language with evidence-first suggestions.
- Safety teams monitor scam patterns across streams.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Modular mock AI service layer (replaceable with real model/API calls)

## Project Structure
```text
app/
  page.tsx                 # Landing page
  buyer/page.tsx           # Buyer demo dashboard
  seller/page.tsx          # Seller mode
  admin/page.tsx           # Admin/safety view
components/
  dashboard/               # Buyer dashboard and comparison UI
  ui/                      # Reusable UI primitives
data/
  mockData.ts              # Seeded sellers, products, streams, flags
services/
  detectClaims.ts
  classifyRiskFlags.ts
  matchEvidence.ts
  generateBuyerQuestions.ts
  calculateTrustScore.ts
  generateSummary.ts
  rewriteSellerPitch.ts
  analyzeSession.ts
  analyzeSellerPitch.ts
types/
  index.ts                 # Domain models and interfaces
lib/
  useSimulatedStream.ts    # Transcript streaming simulation hook
```

## MVP Features

### 1. Landing Page
- Startup-style hero and value proposition
- Problem/opportunity framing
- 3-step “How it works”
- CTA buttons:
  - `Try Demo`
  - `View Seller Mode`

### 2. Buyer Demo Dashboard
- Simulated livestream player (start/pause/reset + speed control)
- Live transcript appears line-by-line
- AI-detected claims panel with confidence labels
- Trust card panel:
  - Overall trust score
  - Verified and unverified claims
  - Risk flags
  - Recommended buyer questions
- 1-minute summary card for late viewers
- Compare streams mini feature
- ASEAN multilingual-ready UI mode toggle (placeholder)
- Export summary PDF placeholder button

### 3. Seller Mode
- Paste transcript or upload `.txt`
- Detect risky wording and claim signals
- Rewrite into more trustworthy wording
- Show trust improvement score and concrete recommendations

### 4. Admin / Safety View
- Flagged stream list with risk levels
- Top repeated scam patterns
- Mock ASEAN country risk overview (heatmap-style placeholders)

## Mock AI Service Layer (AI-Ready Architecture)

Current implementation is deterministic/rule-based, but isolated behind service functions so real AI can be swapped in later:
- `detectClaims()`
- `classifyRiskFlags()`
- `matchEvidence()`
- `generateSummary()`
- `calculateTrustScore()`
- `rewriteSellerPitch()`

Each service includes comments on where to connect:
- OpenAI model calls for extraction/summarization/rewriting
- External verification APIs (documents, certifications)
- Platform APIs (livestream metadata, moderation events)

## Seeded Demo Data
Included in `data/mockData.ts`:
- Sellers
- Products
- Evidence items
- Livestream sessions
- Claim patterns and risk outcomes
- Admin flagged stream and ASEAN risk overview data

Three scenarios are seeded:
1. Mostly trustworthy beauty stream
2. Mixed-quality fashion stream
3. High-risk scammy electronics stream

## Setup
1. Install dependencies:
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Open:
```text
http://localhost:3000
```

## Hackathon Demo Flow
1. Open landing page and explain ASEAN livestream scam problem.
2. Click `Try Demo`.
3. Choose a stream scenario and press `Start`.
4. Show transcript lines appearing in real time.
5. Highlight claims detected and trust score updates.
6. Open the 1-minute summary for late buyers.
7. Switch to `Seller Mode`.
8. Paste risky pitch and show rewrite + trust improvement score.
9. End on `Admin / Safety View` to show scam pattern monitoring and country risk overview.

## Future Roadmap
- Real livestream connectors (TikTok Shop/Shopee when API-ready)
- Real-time multilingual ASR + translation for ASEAN languages
- Model-based claim extraction and deception detection
- OCR-based document proof validation
- Moderator workflow automation and case escalation API
- Downloadable trust report export (real PDF generation)
