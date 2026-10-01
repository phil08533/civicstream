import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocument, getDocuments, fmtDate, SITE_URL } from "@/lib/data";
import { SourceBadge } from "@/components/Cards";

export const dynamicParams = false;
export function generateStaticParams() {
  const ids = getDocuments().map((d) => ({ id: d.id }));
  return ids.length ? ids : [{ id: "_none" }]; // static export needs >=1 param
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = getDocument((await params).id);
  if (!d) return {};
  return { title: d.title, description: d.description?.slice(0, 160) ?? `${d.document_type} published ${d.publication_date} by ${d.agency}.`, alternates: { canonical: `${SITE_URL}/documents/${d.id}/` } };
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const d = getDocument((await params).id);
  if (!d) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: d.title, datePublished: d.publication_date, dateModified: d.updated_at, publisher: { "@type": "GovernmentOrganization", name: d.agency ?? "U.S. Government" }, isBasedOn: d.canonical_url };
  return (
    <article className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><SourceBadge label="Official source: Federal Register" /><span>{d.document_type}</span></div>
      <h1 className="text-2xl font-bold leading-snug">{d.title}</h1>
      <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
        <dt className="font-medium">Agency</dt><dd>{d.agency ?? "—"}</dd>
        <dt className="font-medium">Publication date</dt><dd>{fmtDate(d.publication_date)}</dd>
        <dt className="font-medium">Effective date</dt><dd>{fmtDate(d.effective_date)}</dd>
        <dt className="font-medium">Comment deadline</dt><dd>{fmtDate(d.comment_deadline)}</dd>
        <dt className="font-medium">Document number</dt><dd>{d.external_id}</dd>
      </dl>
      <h2 className="mt-6 font-semibold">Summary (from the Federal Register)</h2>
      <p className="mt-1 text-slate-800">{d.description ?? "No abstract was published for this document. See the official source."}</p>
      <p className="mt-6 flex gap-4 text-sm font-medium">
        <a className="text-blue-700 hover:underline" href={d.canonical_url} rel="noopener">Read the full document at federalregister.gov ↗</a>
        {d.pdf_url && <a className="text-blue-700 hover:underline" href={d.pdf_url} rel="noopener">PDF ↗</a>}
      </p>
      <p className="mt-6 text-xs text-slate-500">Metadata retrieved {fmtDate(d.first_seen_at)}, updated {fmtDate(d.updated_at)}. Federal Register content is published by the Office of the Federal Register.</p>
    </article>
  );
}
