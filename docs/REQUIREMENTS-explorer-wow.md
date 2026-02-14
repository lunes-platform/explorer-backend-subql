# Explorer Requirements — Trust, Intelligence, and Wow Factor

## Document Status

- Status: Draft for approval
- Scope: Lunes Explorer (no cross-chain in this phase)
- Audience: Product Owner, Engineering, Design, QA, Data/Indexer ops

## 1) Product Vision

Build the most trusted and useful explorer in the Lunes ecosystem by combining:

1. Reliable on-chain truth (hybrid data model: RPC + indexer)
2. Actionable intelligence (alerts, anomaly radar, explainability)
3. Delightful experience (fast, clean, confidence-first UX)

## 2) Goals and Non-Goals

### Goals

- Reach feature parity with top explorers in core flows.
- Add differentiated features that reduce time-to-insight.
- Improve user trust and retention through transparent data quality.

### Non-Goals (for this phase)

- Cross-chain analytics and bridge-level comparisons.
- Custodial portfolio management.
- On-chain transaction execution from the explorer.

## 3) Personas and Primary Jobs

### Persona A: Retail user

- Jobs: Check tx status, wallet activity, token/NFT info quickly.
- Success metric: Finds what they need in <20s.

### Persona B: Project team / protocol owner

- Jobs: Monitor ecosystem activity, holder concentration, contract behavior.
- Success metric: Uses dashboard and alerts daily.

### Persona C: Developer / integrator

- Jobs: Inspect blocks/extrinsics/events/contracts reliably.
- Success metric: Can debug incidents without switching tools.

### Persona D: Research / compliance analyst

- Jobs: Export data, track suspicious patterns, verify data lineage.
- Success metric: Can produce evidence-backed reports.

## 4) Product Pillars (with Business Rules)

### Pillar 1 — Data Trust and Reliability

#### Requirements (P1)

- Every metric/table must show source label:
  - `Realtime (RPC)` or `Indexed (SubQuery)`.
- Every data module must show "last updated" timestamp.
- Explorer health banner must exist for degraded indexer conditions.
- Fallback behavior must be explicit and deterministic.

#### Business Rules (P1)

- BR-TRUST-001: Historical listings (blocks/extrinsics/transfers pagination) come from indexer first.
- BR-TRUST-002: Real-time state (current supply, staking status, latest head) comes from RPC first.
- BR-TRUST-003: If indexer is stale beyond threshold (e.g., >120s lag), show warning badge.
- BR-TRUST-004: If indexer unavailable, historical pages switch to degraded mode message (no fake data).
- BR-TRUST-005: No mock data in production paths.

#### Acceptance Criteria (P1)

- User can always identify data source and freshness.
- No silent empty states due to source failure.

### Pillar 2 — Core Explorer Parity

#### Requirements (P2)

- Global Search with type detection (address/hash/block/token/contract/NFT).
- Full detail pages: account, block, extrinsic, token, contract, NFT collection.
- Watchlist and saved entities per connected account.
- Export options (CSV/JSON) for key tables.

#### Business Rules (P2)

- BR-PARITY-001: Search must rank exact hash/address matches above fuzzy results.
- BR-PARITY-002: Detail pages must include deep links to related entities.
- BR-PARITY-003: Watchlist entries must persist per wallet and be restorable.
- BR-PARITY-004: Exported datasets must include query filters and export timestamp.

#### Acceptance Criteria (P2)

- Core routes have complete, connected navigation and reliable pagination.

### Pillar 3 — Intelligence Layer (Innovation)

#### Requirements (P3)

- "Explain this transaction" summaries in plain language.
- Wallet behavior summary (incoming/outgoing profile, unusual activity hints).
- Network Anomaly Feed (spikes in failed extrinsics, TPS anomalies, fee anomalies).

#### Business Rules

- BR-AI-001: AI summaries must include deterministic references (block/extrinsic hash links).
- BR-AI-002: AI output must be labeled as "assisted explanation" not canonical source.
- BR-AI-003: Risk/anomaly flags must be reproducible from observable metrics.
- BR-AI-004: If AI is unavailable, explorer still shows raw data without blocking core flow.

#### Acceptance Criteria

- User gets meaningful insight faster than manual table reading.

### Pillar 4 — Alerts and Monitoring

#### Requirements (P4)

- Alert subscriptions for:
  - Watched wallet receives transfer
  - Token supply threshold change
  - Contract emits selected event
  - Network health threshold breached
- Delivery channels: in-app and webhook/Telegram (phaseable)

#### Business Rules

- BR-ALERT-001: Alerts deduplicated by `(entity, rule, time-window)`.
- BR-ALERT-002: Alerts must be idempotent and traceable with event id.
- BR-ALERT-003: Users can pause/resume alert rules without deleting configuration.

#### Acceptance Criteria

- Alerts are timely, not spammy, and auditable.

### Pillar 5 — UX and Performance Excellence

#### Requirements (P5)

- Mobile-first and desktop stability in navigation and tables.
- Navigation IA grouped by domain (already started with dropdown categories).
- Skeletons and empty states for all async modules.
- Performance targets for main routes.

#### Business Rules

- BR-UX-001: No horizontal overflow in header/nav at common desktop widths.
- BR-UX-002: Every loading state must have visual feedback within 150ms.
- BR-UX-003: Every error state must provide retry and technical context snippet.

#### Acceptance Criteria

- Lighthouse and field metrics improve while preserving design quality.

## 5) Functional Modules and Requirements

### M1: Search 2.0

- Typeahead with grouped results (Accounts, Blocks, Txs, Tokens, Contracts, NFTs).
- Keyboard navigation and enter-to-open.
- Typo tolerance and checksum-aware address handling.

### M2: Entity Labels

- Built-in tags (Treasury, Exchange, Team Wallet, Burn Address).
- Community labels (moderated).
- Label confidence score and source origin.

### M3: Explainability Widgets

- Tx explanation panel.
- Wallet profile card (activity pattern).
- Contract risk snapshot (event concentration, call failures, owner concentration).

### M4: Anomaly Radar

- Health score card (0-100) with components.
- Time-series anomalies with severity and reason.
- Drill-down to affected blocks/extrinsics/contracts.

### M5: Watchlist + Alerts

- Save entities, configure rules, inspect alert history.
- In-app notification center with read/unread states.

## 6) Non-Functional Requirements

- Availability target: 99.5% explorer UI uptime.
- Data freshness targets:
  - RPC widgets: <= 15s refresh for live panels.
  - Indexed tables: <= 60s lag from head under normal conditions.
- Security:
  - No secret leakage in client.
  - Rate limiting and abuse protection for public API endpoints.
- Observability:
  - Structured logs per module.
  - Error budget and latency dashboards.

## 7) KPIs (Success Metrics)

- Time to first correct result (search): < 3s p95.
- Time to insight (top tasks): < 20s median.
- D7 retention increase after watchlist launch.
- Alert action rate (click-through) > defined baseline.
- Reduction in support tickets related to "missing/incorrect data".

## 8) Detailed Implementation Tasks (Backlog)

### Epic A — Data Trust Layer

- A1. Add source/freshness badges to all cards and tables.
- A2. Implement indexer lag monitor in frontend health store.
- A3. Add degraded mode UI for historical pages.
- A4. Add consistency checks (supply/decimals sanity guards).

### Epic B — Search and Discoverability

- B1. Unified search service with type ranking.
- B2. Search autocomplete component with categories.
- B3. Search telemetry: query, result click, zero-result tracking.

### Epic C — Watchlist and Alerts

- C1. Watchlist data model (local first + optional backend sync).
- C2. Alerts rule engine (threshold/event-driven).
- C3. Notification center UI and event audit trail.

### Epic D — Intelligence Features

- D1. Tx explanation adapter with deterministic references.
- D2. Wallet behavior profiler module.
- D3. Anomaly detector pipeline and scoring model.

### Epic E — UX/Performance

- E1. Responsive nav and table overflow audit.
- E2. Route-level loading/error empty-state standardization.
- E3. Performance budget checks and route optimization.

## 9) Task-Level Business Rule Matrix

| Task  | Rule IDs                 | Notes                                        |
| ----- | ------------------------ | -------------------------------------------- |
| A1    | BR-TRUST-001,002         | Must be visible without opening dev tools    |
| A2    | BR-TRUST-003             | Threshold configurable via env               |
| A3    | BR-TRUST-004,005         | No mock fallback                             |
| A4    | BR-TRUST-002             | Use chain decimals source-of-truth           |
| B1-B3 | BR-PARITY-001            | Hash/address exact match priority            |
| C1-C3 | BR-ALERT-001,002,003     | Idempotency and pause/resume required        |
| D1-D3 | BR-AI-001,002,003,004    | Explainability cannot block core UX          |
| E1-E3 | BR-UX-001,002,003        | Must pass responsive and UX audits           |

## 10) Rollout Plan (No Cross-Chain)

### Phase 1 (0-30 days)

- A1-A4, B1 baseline, E1
- Outcome: trust and consistency foundation

### Phase 2 (30-60 days)

- B2-B3, C1-C2, E2
- Outcome: engagement and proactive usage

### Phase 3 (60-90 days)

- D1-D3, C3, E3
- Outcome: differentiated intelligence experience

## 11) Risks and Mitigations

- Risk: Data mismatch between sources.
  - Mitigation: source badge + freshness + sanity checks + explicit precedence.
- Risk: Alert noise.
  - Mitigation: dedup windows and severity thresholds.
- Risk: AI hallucination.
  - Mitigation: hard reference links and "assisted explanation" labeling.

## 12) Definition of Done (Program Level)

- Feature parity baseline completed and measurable.
- Innovation modules shipped behind feature flags and validated.
- KPI instrumentation live and reviewed weekly.
- No production mock-data paths.
- Cross-chain explicitly excluded from this release scope.
