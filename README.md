# CivicStream — Government information, organized.

A static, neutral, searchable view of U.S. government information (Congress.gov bills, Federal Register documents), each item linked to its official source. Hosted on **GitHub Pages**; no server or database in this phase.

## How it works
1. **Ingest** (`npm run ingest`, hourly via GitHub Actions) pulls from official APIs through source adapters, dedupes on `source + external_id`, and writes JSON into `data/`.
2. **Build** (`next build`, static export) renders every bill/document page plus a client-side search index.
3. **Deploy** to GitHub Pages.

## Develop
```bash
npm ci
npm run ingest:fixtures   # sample data for local dev ONLY (invented records; do not commit data/ after this)
npm run dev
npm test && npm run typecheck
```
Reset sample data with `git checkout data`.

## Deploy setup (one-time)
1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Add secret `CONGRESS_API_KEY` (free: https://api.congress.gov/sign-up/). Without it, only the Federal Register is ingested.
3. Optional repo variables: `BASE_PATH` (empty for a custom domain), `SITE_URL`.
4. Run the workflow manually once to populate data.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design and the paid-AI roadmap.
