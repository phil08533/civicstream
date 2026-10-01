import type { Metadata } from "next";
import { DocumentCard } from "@/components/Cards";
import { getDocuments } from "@/lib/data";

export const metadata: Metadata = { title: "Federal Register documents", description: "Recent rules, proposed rules, and notices from the Federal Register." };

export default function Documents() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Federal Register documents</h1>
      <div className="grid gap-3 md:grid-cols-2">{getDocuments().slice(0, 100).map((d) => <DocumentCard key={d.id} d={d} />)}</div>
    </div>
  );
}
