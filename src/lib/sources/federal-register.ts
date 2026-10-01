import type { DocumentType, GovernmentDocument } from "../types";
import { getJson, type Fetcher, type FetchOptions, type GovernmentSourceAdapter } from "./adapter";

const BASE = "https://www.federalregister.gov/api/v1";
const FIELDS = ["document_number", "title", "abstract", "type", "publication_date", "html_url", "pdf_url", "agencies", "effective_on", "comments_close_on"];

const TYPE_MAP: Record<string, DocumentType> = {
  Rule: "Rule", "Proposed Rule": "Proposed Rule", Notice: "Notice", "Presidential Document": "Presidential Document",
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export class FederalRegisterAdapter implements GovernmentSourceAdapter<GovernmentDocument> {
  readonly sourceName = "Federal Register";
  readonly sourceType = "api" as const;
  readonly sourceId = "federal-register" as const;
  constructor(private fetcher: Fetcher = fetch) {}

  async fetchLatest({ since, limit = 200 }: FetchOptions = {}): Promise<GovernmentDocument[]> {
    const params = new URLSearchParams({ per_page: String(Math.min(limit, 1000)), order: "newest" });
    FIELDS.forEach((f) => params.append("fields[]", f));
    if (since) params.set("conditions[publication_date][gte]", since);
    const json = (await getJson(`${BASE}/documents.json?${params}`, this.fetcher)) as { results?: unknown };
    if (!json || !Array.isArray(json.results)) throw new Error("Federal Register: unexpected response shape");
    const now = new Date();
    return json.results.map((r) => this.normalize(r, now)).filter((d): d is GovernmentDocument => d !== null).slice(0, limit);
  }

  async fetchById(id: string) {
    const json = await getJson(`${BASE}/documents/${encodeURIComponent(id)}.json`, this.fetcher);
    return this.normalize(json);
  }

  /** Returns null (skip) for records missing the fields we need to dedupe and link. */
  normalize(raw: unknown, now = new Date()): GovernmentDocument | null {
    const r = raw as Record<string, unknown> | null;
    const externalId = str(r?.document_number);
    const title = str(r?.title);
    const url = str(r?.html_url);
    if (!externalId || !title || !url || !isDate(r?.publication_date)) return null;
    const agencies = Array.isArray(r?.agencies) ? (r!.agencies as Array<Record<string, unknown>>) : [];
    const ts = now.toISOString();
    return {
      id: `fr-${externalId.toLowerCase()}`,
      source: "federal-register",
      external_id: externalId,
      title,
      description: str(r?.abstract),
      document_type: TYPE_MAP[String(r?.type)] ?? "Other",
      agency: agencies.map((a) => str(a.name)).filter(Boolean).join(", ") || null,
      agency_slug: str(agencies[0]?.slug),
      publication_date: r!.publication_date as string,
      effective_date: isDate(r?.effective_on) ? (r!.effective_on as string) : null,
      comment_deadline: isDate(r?.comments_close_on) ? (r!.comments_close_on as string) : null,
      canonical_url: url,
      pdf_url: str(r?.pdf_url),
      first_seen_at: ts,
      updated_at: ts,
    };
  }

  getCanonicalUrl(item: GovernmentDocument) { return item.canonical_url; }
}
