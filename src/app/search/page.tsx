import type { Metadata } from "next";
import SearchClient from "./SearchClient";
export const metadata: Metadata = { title: "Search", description: "Search recent bills and Federal Register documents." };
export default function Search() { return <SearchClient basePath={process.env.NEXT_PUBLIC_BASE_PATH || ""} />; }
