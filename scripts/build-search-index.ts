// Generates public/search-index.json (loaded lazily by /search/). Runs on `prebuild`.
import fs from "node:fs";
import path from "node:path";

const read = (f: string) => { try { return JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data", f), "utf8")); } catch { return []; } };
const docs = read("documents.json").map((d: any) => ({
  id: `d:${d.id}`, kind: "document", title: d.title, description: d.description ?? "", source: "Federal Register",
  agency: d.agency ?? "", type: d.document_type, date: d.publication_date, href: `/documents/${d.id}/`, url: d.canonical_url,
}));
const bills = read("legislation.json").map((b: any) => ({
  id: `b:${b.id}`, kind: "bill", title: b.title, description: b.latest_action ?? "", source: "Congress.gov",
  agency: b.origin_chamber ?? "", type: "Bill", date: b.latest_action_date ?? b.update_date ?? "", href: `/legislation/${b.id}/`, url: b.canonical_url,
  congress: String(b.congress), number: `${b.bill_type} ${b.bill_number}`,
}));
fs.mkdirSync(path.resolve(__dirname, "../public"), { recursive: true });
fs.writeFileSync(path.resolve(__dirname, "../public/search-index.json"), JSON.stringify([...docs, ...bills]));
console.log(`search index: ${docs.length} documents, ${bills.length} bills`);
