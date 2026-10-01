import type { Metadata } from "next";
import { BillCard } from "@/components/Cards";
import { getLegislation } from "@/lib/data";

export const metadata: Metadata = { title: "Legislation", description: "Recently updated bills and resolutions in the U.S. Congress." };

export default function Legislation() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Legislation</h1>
      <div className="grid gap-3 md:grid-cols-2">{getLegislation().slice(0, 100).map((b) => <BillCard key={b.id} b={b} />)}</div>
    </div>
  );
}
