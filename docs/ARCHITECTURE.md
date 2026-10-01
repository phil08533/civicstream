# Architecture

## Constraints
GitHub Pages serves static files only. Hence: static Next.js export, ingestion in GitHub Actions, client-side search. API keys exist only in Actions secrets.

## Layout
- `src/lib/sources/` — `GovernmentSourceAdapter` interface; `federal-register.ts` (no key), `congress.ts` (key). Add a source by implementing the interface and registering it in `scripts/ingest.ts`.
- `src/lib/store.ts` — idempotent upsert on `source:external_id`.
- `scripts/ingest.ts` — per-source isolation (one failure does not block others), retry/backoff on 429/5xx, run log in `data/ingestion-runs.json`, 120-day retention.
- `scripts/build-search-index.ts` — `public/search-index.json`, lazy-loaded by `/search/` with MiniSearch.
- `data/` — committed JSON produced by the workflow (the "database" for the free site).

## Data handling
Only metadata and publisher-supplied abstracts are stored; full text stays at the source. Every page links to the official record. No AI content exists in this phase.

## Scaling the static approach
Retention caps page count (~thousands). If the build gets slow or the search index exceeds ~5 MB, move to Supabase Postgres + FTS.

## Paid AI research (next product, not built yet)
Needs a server, so it will be a small separate service: Supabase (auth, Postgres FTS, `ai_usage` table) + one edge function (Cloudflare Worker or Supabase Edge) that does retrieval over the ingested data, calls an AI provider behind an abstraction, and returns cited answers. The static site calls it; Pages is unchanged.

Cost-first rollout:
1. Ship a gated beta with a hard global monthly budget cap and per-user credits (free 5/mo).
2. Log per request: user, model, input/output tokens, estimated cost, latency, retrieval count.
3. Review cost/user and cost/request weekly; tune model routing and limits.
4. Add Stripe only once free-tier usage shows demand; expand features only as subscribers justify.
