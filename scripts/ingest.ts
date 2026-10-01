/**
 * Scheduled ingestion. Idempotent: re-running never duplicates records.
 * Usage: tsx scripts/ingest.ts [--fixtures]
 * Writes data/documents.json, data/legislation.json, data/ingestion-runs.json
 */
import fs from "node:fs";
import path from "node:path";
import { FederalRegisterAdapter } from "../src/lib/sources/federal-register";
import { CongressAdapter } from "../src/lib/sources/congress";
import { mergeRecords } from "../src/lib/store";
import type { Fetcher } from "../src/lib/sources/adapter";
import type { GovernmentDocument, IngestionRun, Legislation, SourceRecord } from "../src/lib/types";

const DATA = path.resolve(__dirname, "../data");
const FIX = path.resolve(__dirname, "../fixtures");
const useFixtures = process.argv.includes("--fixtures");
const RETENTION_DAYS = 120; // keeps the static site small; older items stay at their source

const read = <T>(f: string, fallback: T): T => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")); } catch { return fallback; }
};
const write = (f: string, v: unknown) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + "\n");

const fixtureFetcher = (file: string): Fetcher => async () =>
  new Response(fs.readFileSync(path.join(FIX, file), "utf8"), { status: 200, headers: { "content-type": "application/json" } });

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);

async function runSource<T extends SourceRecord>(
  source: IngestionRun["source"], file: string, fetchAll: () => Promise<T[]>, runs: IngestionRun[],
) {
  const started = new Date().toISOString();
  try {
    const fetched = await fetchAll();
    const { records, inserted, updated } = mergeRecords(read<T[]>(file, []), fetched);
    write(file, records);
    runs.push({ source, started_at: started, finished_at: new Date().toISOString(), status: "success", fetched: fetched.length, inserted, updated });
    console.log(`${source}: fetched=${fetched.length} inserted=${inserted} updated=${updated}`);
  } catch (e) {
    // One failing source must not block the others; the failure is logged in ingestion-runs.json.
    const error = e instanceof Error ? e.message : String(e);
    runs.push({ source, started_at: started, finished_at: new Date().toISOString(), status: "error", fetched: 0, inserted: 0, updated: 0, error });
    console.error(`${source} FAILED: ${error}`);
    process.exitCode = process.exitCode ?? 0; // surfaced via run log, not a failed deploy
  }
}

async function main() {
  fs.mkdirSync(DATA, { recursive: true });
  const runs: IngestionRun[] = [];

  const fr = new FederalRegisterAdapter(useFixtures ? fixtureFetcher("federal-register.json") : fetch);
  await runSource<GovernmentDocument>("federal-register", "documents.json", () => fr.fetchLatest({ since: daysAgo(14), limit: 500 }), runs);

  const key = process.env.CONGRESS_API_KEY;
  if (useFixtures || key) {
    const cg = new CongressAdapter(key || "fixture", useFixtures ? fixtureFetcher("congress-bills.json") : fetch);
    await runSource<Legislation>("congress-gov", "legislation.json", () => cg.fetchLatest({ since: daysAgo(14), limit: 250 }), runs);
  } else {
    console.warn("CONGRESS_API_KEY not set; skipping Congress.gov");
  }

  // Retention: trim old records from the static data set.
  const cutoff = daysAgo(RETENTION_DAYS);
  write("documents.json", read<GovernmentDocument[]>("documents.json", []).filter((d) => d.publication_date >= cutoff));
  write("legislation.json", read<Legislation[]>("legislation.json", []).filter((b) => (b.update_date ?? "9999") >= cutoff));

  const history = [...runs, ...read<IngestionRun[]>("ingestion-runs.json", [])].slice(0, 200);
  write("ingestion-runs.json", history);
  if (runs.length && runs.every((r) => r.status === "error")) process.exitCode = 1;
}
main();
