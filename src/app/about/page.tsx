import type { Metadata } from "next";
export const metadata: Metadata = { title: "About & sources", description: "Where CivicStream's data comes from and how it is presented." };
export default function About() {
  return (
    <div className="prose max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">About CivicStream</h1>
      <p>CivicStream organizes publicly available U.S. government information and links every item to its official source. It is independent, nonpartisan, and does not recommend candidates, parties, bills, or positions.</p>
      <h2 className="text-lg font-semibold">Sources</h2>
      <ul className="list-disc pl-5">
        <li><b>Congress.gov</b> (Library of Congress) — bill metadata via the official Congress.gov API.</li>
        <li><b>Federal Register</b> (Office of the Federal Register) — rules, proposed rules and notices via its public API.</li>
      </ul>
      <p>Federal Register and Congress.gov content is generally U.S. government work, but not everything on government sites is public domain; CivicStream stores metadata and short official abstracts and links out for full text.</p>
      <h2 className="text-lg font-semibold">AI</h2>
      <p>Nothing on this site is AI-generated today. Any future AI features will be clearly labeled and will cite primary sources.</p>
    </div>
  );
}
