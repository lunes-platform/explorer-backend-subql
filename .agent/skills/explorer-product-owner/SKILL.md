---
name: explorer-product-owner
description: Product-owner framework for blockchain explorer roadmap decisions. Use for requirements, business rules, prioritization, and rollout plans (without cross-chain unless explicitly requested).
allowed-tools: Read, Glob, Grep
---

# Explorer Product Owner Skill

Use this skill when defining or reviewing high-impact roadmap items for the Lunes Explorer.

## Source of truth
- `docs/REQUIREMENTS-explorer-wow.md`

## What this skill produces
1. Requirements by pillar (trust, parity, intelligence, alerts, UX)
2. Business rules with stable IDs (`BR-*`)
3. Prioritized implementation tasks (epics + phased rollout)
4. Risks, mitigations, KPIs, and definition of done

## Mandatory constraints
- No cross-chain scope unless user explicitly asks.
- No mock/fake data in production recommendations.
- Preserve hybrid architecture:
  - Historical/paginated: indexer-first
  - Real-time state: RPC-first

## Review checklist
- [ ] Every feature has business rule mapping
- [ ] Every phase has measurable outcome
- [ ] Observability and degraded mode included
- [ ] User trust mechanisms visible in UI
- [ ] KPI instrumentation defined
