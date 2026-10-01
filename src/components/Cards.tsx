import Link from "next/link";
import type { GovernmentDocument, Legislation } from "@/lib/types";
import { billLabel, fmtDate } from "@/lib/data";

export function SourceBadge({ label }: { label: string }) {
  return <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">{label}</span>;
}

export function DocumentCard({ d }: { d: GovernmentDocument }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <SourceBadge label="Federal Register" /><span>{d.document_type}</span><span>·</span><span>{fmtDate(d.publication_date)}</span>
      </div>
      <h3 className="font-semibold leading-snug"><Link href={`/documents/${d.id}/`} className="hover:underline">{d.title}</Link></h3>
      {d.agency && <p className="mt-0.5 text-sm text-slate-600">{d.agency}</p>}
      {d.description && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{d.description}</p>}
      <a href={d.canonical_url} rel="noopener" className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">View source ↗</a>
    </article>
  );
}

export function BillCard({ b }: { b: Legislation }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <SourceBadge label="Congress.gov" /><span>{billLabel(b)} · {b.congress}th Congress</span><span>·</span><span>{fmtDate(b.latest_action_date)}</span>
      </div>
      <h3 className="font-semibold leading-snug"><Link href={`/legislation/${b.id}/`} className="hover:underline">{b.title}</Link></h3>
      {b.latest_action && <p className="mt-2 line-clamp-2 text-sm text-slate-700"><span className="font-medium">Latest action:</span> {b.latest_action}</p>}
      <a href={b.canonical_url} rel="noopener" className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">View source ↗</a>
    </article>
  );
}
