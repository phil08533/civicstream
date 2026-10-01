import fs from "node:fs";
import path from "node:path";
import type { GovernmentDocument, IngestionRun, Legislation } from "./types";

const DATA = path.join(process.cwd(), "data");
const read = <T,>(f: string): T[] => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")); } catch { return []; }
};

export const getDocuments = (): GovernmentDocument[] =>
  read<GovernmentDocument>("documents.json").sort((a, b) => b.publication_date.localeCompare(a.publication_date) || a.id.localeCompare(b.id));
export const getLegislation = (): Legislation[] =>
  read<Legislation>("legislation.json").sort((a, b) => (b.update_date ?? "").localeCompare(a.update_date ?? "") || a.id.localeCompare(b.id));
export const getRuns = (): IngestionRun[] => read<IngestionRun>("ingestion-runs.json");

export const getDocument = (id: string) => getDocuments().find((d) => d.id === id);
export const getBill = (id: string) => getLegislation().find((b) => b.id === id);

export function agencies() {
  const m = new Map<string, { name: string; slug: string; count: number }>();
  for (const d of getDocuments()) {
    if (!d.agency || !d.agency_slug) continue;
    const e = m.get(d.agency_slug) ?? { name: d.agency.split(", ")[0], slug: d.agency_slug, count: 0 };
    e.count++; m.set(d.agency_slug, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://phil08533.github.io/civicstream").replace(/\/$/, "");
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const billLabel = (b: Legislation) => `${b.bill_type.replace(/^(H|S)(RES|JRES|CONRES)$/, "$1.$2.").replace(/^(HR|S)$/, (m) => (m === "HR" ? "H.R." : "S."))} ${b.bill_number}`;
export const fmtDate = (d: string | null) => (d ? new Date(d + (d.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "—");
