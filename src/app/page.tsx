import Link from "next/link";
import { DocumentCard, BillCard } from "@/components/Cards";
import { getDocuments, getLegislation, getRuns, fmtDate } from "@/lib/data";

export default function Home() {
  const docs = getDocuments();
  const bills = getLegislation();
  const comments = docs.filter((d) => d.comment_deadline).sort((a, b) => a.comment_deadline!.localeCompare(b.comment_deadline!)).slice(0, 5);
  const lastRun = getRuns().find((r) => r.status === "success");
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold text-[--color-ink]">Government information, organized.</h1>
        <p className="mt-2 max-w-2xl text-slate-700">Recent legislation and federal rulemaking, drawn from Congress.gov and the Federal Register, each linked to its official source.</p>
        <Link href="/search/" className="mt-4 inline-block rounded bg-blue-700 px-4 py-2 font-medium text-white no-underline">Search government information</Link>
        {lastRun && <p className="mt-3 text-xs text-slate-500">Data last refreshed {fmtDate(lastRun.finished_at)}.</p>}
      </section>

      {docs.length === 0 && bills.length === 0 && <p className="rounded border border-dashed p-6 text-slate-600">No data ingested yet. Run the ingestion workflow to populate the site.</p>}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Latest Federal Register documents</h2>
        <div className="grid gap-3 md:grid-cols-2">{docs.slice(0, 8).map((d) => <DocumentCard key={d.id} d={d} />)}</div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recently updated bills</h2>
        <div className="grid gap-3 md:grid-cols-2">{bills.slice(0, 8).map((b) => <BillCard key={b.id} b={b} />)}</div>
      </section>

      {comments.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Public comment deadlines</h2>
          <ul className="divide-y rounded-lg border bg-white">
            {comments.map((d) => (
              <li key={d.id} className="flex gap-4 p-3 text-sm"><span className="w-28 shrink-0 font-medium">{fmtDate(d.comment_deadline)}</span><Link href={`/documents/${d.id}/`} className="hover:underline">{d.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
