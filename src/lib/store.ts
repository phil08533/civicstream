import type { SourceRecord } from "./types";

export interface MergeResult<T> { records: T[]; inserted: number; updated: number }

/** Idempotent upsert keyed by source + external_id. Keeps first_seen_at; bumps updated_at only on change. */
export function mergeRecords<T extends SourceRecord>(existing: T[], incoming: T[]): MergeResult<T> {
  const map = new Map(existing.map((r) => [`${r.source}:${r.external_id}`, r]));
  let inserted = 0, updated = 0;
  for (const rec of incoming) {
    const key = `${rec.source}:${rec.external_id}`;
    const prev = map.get(key);
    if (!prev) { map.set(key, rec); inserted++; continue; }
    const { first_seen_at: _a, updated_at: _b, ...prevData } = prev;
    const { first_seen_at: _c, updated_at: _d, ...nextData } = rec;
    if (JSON.stringify(prevData) !== JSON.stringify(nextData)) {
      map.set(key, { ...rec, first_seen_at: prev.first_seen_at });
      updated++;
    }
  }
  return { records: [...map.values()], inserted, updated };
}
