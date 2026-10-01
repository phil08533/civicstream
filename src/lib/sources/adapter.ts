import type { SourceId } from "../types";

export type Fetcher = typeof fetch;

export interface FetchOptions {
  /** Only return items updated/published on or after this date (YYYY-MM-DD). */
  since?: string;
  /** Hard cap on items, to respect rate limits. */
  limit?: number;
}

/** Add a new government source by implementing this; the ingest runner is source-agnostic. */
export interface GovernmentSourceAdapter<T> {
  readonly sourceName: string;
  readonly sourceType: "api" | "rss" | "html";
  readonly sourceId: SourceId;
  fetchLatest(opts?: FetchOptions): Promise<T[]>;
  fetchById?(id: string): Promise<T | null>;
  normalize(raw: unknown, now?: Date): T | null;
  getCanonicalUrl(item: T): string;
}

export class HttpError extends Error {
  constructor(public status: number, url: string) {
    super(`HTTP ${status} for ${url.replace(/api_key=[^&]+/, "api_key=***")}`);
  }
}

/** GET JSON with retry/backoff on 429 and 5xx (honors Retry-After). */
export async function getJson(
  url: string,
  fetcher: Fetcher = fetch,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<unknown> {
  const { retries = 3, baseDelayMs = 1000 } = opts;
  for (let attempt = 0; ; attempt++) {
    const res = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "CivicStream/0.1 (+https://github.com/phil08533/civicstream)" } });
    if (res.ok) {
      try { return await res.json(); } catch { throw new Error(`Invalid JSON from ${url.replace(/api_key=[^&]+/, "api_key=***")}`); }
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) throw new HttpError(res.status, url);
    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * 2 ** attempt;
    await new Promise((r) => setTimeout(r, delay));
  }
}
