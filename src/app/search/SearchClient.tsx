"use client";
import { useEffect, useMemo, useState } from "react";
import type MiniSearchT from "minisearch";

interface Item { id: string; kind: string; title: string; description: string; source: string; agency: string; type: string; date: string; href: string; url: string }

export default function SearchClient({ basePath }: { basePath: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [engine, setEngine] = useState<MiniSearchT<Item> | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    setQ(new URLSearchParams(location.search).get("q") ?? "");
    // The index and search library load only on this page.
    Promise.all([fetch(`${basePath}/search-index.json`).then((r) => r.json()), import("minisearch")])
      .then(([data, { default: MiniSearch }]: [Item[], { default: typeof MiniSearchT }]) => {
        const ms = new MiniSearch<Item>({ fields: ["title", "description", "agency", "number"], storeFields: [], searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.15 } });
        ms.addAll(data);
        setItems(data); setEngine(ms);
      })
      .catch(() => setError(true));
  }, [basePath]);

  const byId = useMemo(() => new Map((items ?? []).map((i) => [i.id, i])), [items]);
  const results = useMemo(() => {
    if (!engine || !items) return [];
    const base = q.trim() ? engine.search(q).map((r) => byId.get(r.id)!) : [...items].sort((a, b) => b.date.localeCompare(a.date));
    return base.filter((i) => (!type || i.type === type) && (!source || i.source === source)).slice(0, 50);
  }, [engine, items, byId, q, type, source]);

  const types = useMemo(() => [...new Set((items ?? []).map((i) => i.type))].sort(), [items]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Search</h1>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bills and documents" className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2" />
        <select aria-label="Document type" value={type} onChange={(e) => setType(e.target.value)} className="rounded border border-slate-300 bg-white px-2"><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)} className="rounded border border-slate-300 bg-white px-2"><option value="">All sources</option><option>Congress.gov</option><option>Federal Register</option></select>
      </div>
      {error && <p className="mt-4 text-red-700">Search is unavailable right now. Please try again later.</p>}
      {!items && !error && <p className="mt-4 text-slate-600">Loading…</p>}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-600"><b className="uppercase">{r.source}</b> · {r.type} · {r.date}</div>
            <a href={`${basePath}${r.href}`} className="font-semibold hover:underline">{r.title}</a>
            {r.agency && <div className="text-sm text-slate-600">{r.agency}</div>}
            {r.description && <p className="mt-1 line-clamp-2 text-sm text-slate-700">{r.description}</p>}
            <a href={r.url} rel="noopener" className="text-sm font-medium text-blue-700 hover:underline">View source ↗</a>
          </li>
        ))}
        {items && results.length === 0 && <li className="text-slate-600">No results.</li>}
      </ul>
    </div>
  );
}
