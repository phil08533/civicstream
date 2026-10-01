import type { MetadataRoute } from "next";
import { getDocuments, getLegislation, SITE_URL } from "@/lib/data";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, d?: string) => ({ url: `${SITE_URL}${p}`, lastModified: d });
  return [u("/"), u("/search/"), u("/legislation/"), u("/documents/"), u("/about/"),
    ...getDocuments().map((d) => u(`/documents/${d.id}/`, d.updated_at)),
    ...getLegislation().map((b) => u(`/legislation/${b.id}/`, b.updated_at))];
}
