export type SourceId = "federal-register" | "congress-gov" | "govinfo" | "news";

export type DocumentType =
  | "Rule" | "Proposed Rule" | "Notice" | "Presidential Document" | "News Release" | "Other";

/** A government publication (Federal Register, agency news, GovInfo...). */
export interface GovernmentDocument {
  id: string;                 // stable slug, e.g. "fr-2025-12345"
  source: SourceId;
  external_id: string;        // dedup key together with `source`
  title: string;
  description: string | null; // abstract/summary as published, never AI-written
  document_type: DocumentType;
  agency: string | null;
  agency_slug: string | null;
  publication_date: string;   // YYYY-MM-DD
  effective_date: string | null;
  comment_deadline: string | null;
  canonical_url: string;      // official source page
  pdf_url: string | null;
  first_seen_at: string;      // ISO timestamp
  updated_at: string;         // ISO timestamp
}

export interface Legislation {
  id: string;                 // slug, e.g. "119-hr-1234"
  source: "congress-gov";
  external_id: string;        // "119-hr-1234"
  congress: number;
  bill_type: string;          // "HR", "S", "HJRES", ...
  bill_number: string;
  title: string;
  origin_chamber: string | null;
  latest_action: string | null;
  latest_action_date: string | null;
  update_date: string | null;
  canonical_url: string;
  first_seen_at: string;
  updated_at: string;
}

export type SourceRecord = GovernmentDocument | Legislation;

export interface IngestionRun {
  source: SourceId;
  started_at: string;
  finished_at: string;
  status: "success" | "error";
  fetched: number;
  inserted: number;
  updated: number;
  error?: string;
}

/** Provenance + licensing notes shown on /about/sources. */
export interface SourceInfo {
  id: SourceId;
  organization: string;
  url: string;
  type: "api" | "rss";
  license_note: string;
}
