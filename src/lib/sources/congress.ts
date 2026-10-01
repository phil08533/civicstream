import type { Legislation } from "../types";
import { getJson, type Fetcher, type FetchOptions, type GovernmentSourceAdapter } from "./adapter";

const BASE = "https://api.congress.gov/v3";

const URL_SEGMENT: Record<string, string> = {
  HR: "house-bill", S: "senate-bill", HJRES: "house-joint-resolution", SJRES: "senate-joint-resolution",
  HCONRES: "house-concurrent-resolution", SCONRES: "senate-concurrent-resolution", HRES: "house-resolution", SRES: "senate-resolution",
};

export const ordinal = (n: number) => {
  const v = n % 100;
  const s = v >= 11 && v <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
};

export function billCanonicalUrl(congress: number, type: string, number: string) {
  const seg = URL_SEGMENT[type.toUpperCase()];
  return seg ? `https://www.congress.gov/bill/${ordinal(congress)}-congress/${seg}/${number}` : null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Requires CONGRESS_API_KEY; the key stays in the ingestion job and never reaches the browser. */
export class CongressAdapter implements GovernmentSourceAdapter<Legislation> {
  readonly sourceName = "Congress.gov";
  readonly sourceType = "api" as const;
  readonly sourceId = "congress-gov" as const;
  constructor(private apiKey: string, private fetcher: Fetcher = fetch) {
    if (!apiKey) throw new Error("CONGRESS_API_KEY is required");
  }

  async fetchLatest({ since, limit = 100 }: FetchOptions = {}): Promise<Legislation[]> {
    const params = new URLSearchParams({ api_key: this.apiKey, format: "json", limit: String(Math.min(limit, 250)), sort: "updateDate+desc" });
    if (since) params.set("fromDateTime", `${since}T00:00:00Z`);
    // URLSearchParams encodes "+"; the API expects a literal space-or-plus, so set sort explicitly.
    const url = `${BASE}/bill?${params.toString().replace("updateDate%2Bdesc", "updateDate+desc")}`;
    const json = (await getJson(url, this.fetcher)) as { bills?: unknown };
    if (!json || !Array.isArray(json.bills)) throw new Error("Congress.gov: unexpected response shape");
    const now = new Date();
    return json.bills.map((b) => this.normalize(b, now)).filter((b): b is Legislation => b !== null);
  }

  normalize(raw: unknown, now = new Date()): Legislation | null {
    const r = raw as Record<string, any> | null;
    const congress = Number(r?.congress);
    const type = str(r?.type)?.toUpperCase();
    const number = r?.number != null ? String(r.number) : null;
    const title = str(r?.title);
    if (!congress || !type || !number || !title) return null;
    const canonical = billCanonicalUrl(congress, type, number);
    if (!canonical) return null;
    const slug = `${congress}-${type.toLowerCase()}-${number}`;
    const ts = now.toISOString();
    return {
      id: slug, source: "congress-gov", external_id: slug, congress, bill_type: type, bill_number: number, title,
      origin_chamber: str(r?.originChamber),
      latest_action: str(r?.latestAction?.text),
      latest_action_date: str(r?.latestAction?.actionDate),
      update_date: str(r?.updateDate),
      canonical_url: canonical, first_seen_at: ts, updated_at: ts,
    };
  }

  getCanonicalUrl(item: Legislation) { return item.canonical_url; }
}
