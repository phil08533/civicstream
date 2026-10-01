import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBill, getLegislation, billLabel, fmtDate, SITE_URL } from "@/lib/data";
import { SourceBadge } from "@/components/Cards";

export const dynamicParams = false;
export function generateStaticParams() {
  const ids = getLegislation().map((b) => ({ id: b.id }));
  return ids.length ? ids : [{ id: "_none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const b = getBill((await params).id);
  if (!b) return {};
  return { title: `${billLabel(b)}: ${b.title}`, description: `${billLabel(b)} in the ${b.congress}th Congress. ${b.latest_action ?? ""}`.trim().slice(0, 160), alternates: { canonical: `${SITE_URL}/legislation/${b.id}/` } };
}

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const b = getBill((await params).id);
  if (!b) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Legislation", name: b.title, legislationIdentifier: billLabel(b), url: b.canonical_url, dateModified: b.update_date ?? undefined };
  return (
    <article className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><SourceBadge label="Official source: Congress.gov" /><span>{b.congress}th Congress</span></div>
      <h1 className="text-2xl font-bold leading-snug">{billLabel(b)}: {b.title}</h1>
      <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
        <dt className="font-medium">Originating chamber</dt><dd>{b.origin_chamber ?? "—"}</dd>
        <dt className="font-medium">Latest action</dt><dd>{b.latest_action ?? "—"}</dd>
        <dt className="font-medium">Latest action date</dt><dd>{fmtDate(b.latest_action_date)}</dd>
        <dt className="font-medium">Last updated</dt><dd>{fmtDate(b.update_date)}</dd>
      </dl>
      <p className="mt-6 text-sm font-medium"><a className="text-blue-700 hover:underline" href={b.canonical_url} rel="noopener">Full text, sponsors, cosponsors and history at Congress.gov ↗</a></p>
      <p className="mt-6 text-xs text-slate-500">Source: Congress.gov (Library of Congress). Sponsor, cosponsor, timeline and text details are planned for a later release.</p>
    </article>
  );
}
