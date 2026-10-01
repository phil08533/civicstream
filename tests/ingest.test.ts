import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { FederalRegisterAdapter } from "@/lib/sources/federal-register";
import { CongressAdapter, billCanonicalUrl, ordinal } from "@/lib/sources/congress";
import { getJson } from "@/lib/sources/adapter";
import { mergeRecords } from "@/lib/store";

const fx = (f: string) => fs.readFileSync(`fixtures/${f}`, "utf8");
const ok = (body: string) => (async () => new Response(body, { status: 200 })) as typeof fetch;

describe("Federal Register adapter", () => {
  it("normalizes documents and joins multiple agencies", async () => {
    const docs = await new FederalRegisterAdapter(ok(fx("federal-register.json"))).fetchLatest();
    expect(docs).toHaveLength(3);
    expect(docs[1].agency).toBe("Federal Aviation Administration, Transportation Department");
    expect(docs[0].comment_deadline).toBe("2026-11-30");
    expect(docs[2].description).toBeNull();
  });
  it("skips records missing required fields", () => {
    const a = new FederalRegisterAdapter(ok("{}"));
    expect(a.normalize({ title: "x" })).toBeNull();
    expect(a.normalize({ document_number: "1", title: "t", html_url: "u", publication_date: "bad" })).toBeNull();
    expect(a.normalize(null)).toBeNull();
  });
  it("rejects invalid API shape", async () => {
    await expect(new FederalRegisterAdapter(ok('{"oops":1}')).fetchLatest()).rejects.toThrow(/unexpected/);
    await expect(new FederalRegisterAdapter(ok("not json")).fetchLatest()).rejects.toThrow(/Invalid JSON/);
  });
});

describe("Congress adapter", () => {
  it("requires an API key", () => expect(() => new CongressAdapter("")).toThrow());
  it("normalizes bills with canonical URLs and tolerates missing latestAction", async () => {
    const bills = await new CongressAdapter("k", ok(fx("congress-bills.json"))).fetchLatest();
    expect(bills.map((b) => b.id)).toEqual(["119-hr-1234", "119-s-567", "119-hjres-12"]);
    expect(bills[0].canonical_url).toBe("https://www.congress.gov/bill/119th-congress/house-bill/1234");
    expect(bills[2].latest_action).toBeNull();
  });
  it("builds ordinals and rejects unknown bill types", () => {
    expect([1, 2, 3, 11, 12, 21, 119].map(ordinal)).toEqual(["1st", "2nd", "3rd", "11th", "12th", "21st", "119th"]);
    expect(billCanonicalUrl(119, "ZZ", "1")).toBeNull();
  });
  it("never leaks the API key in errors", async () => {
    const f = (async () => new Response("", { status: 403 })) as typeof fetch;
    await expect(new CongressAdapter("SECRET", f).fetchLatest()).rejects.not.toThrow(/SECRET/);
  });
});

describe("getJson retry", () => {
  it("retries 429 then succeeds", async () => {
    let n = 0;
    const f = (async () => (++n < 3 ? new Response("", { status: 429, headers: { "retry-after": "0" } }) : new Response("{}"))) as typeof fetch;
    expect(await getJson("http://x", f, { baseDelayMs: 1 })).toEqual({});
    expect(n).toBe(3);
  });
  it("fails fast on 404", async () => {
    let n = 0;
    const f = (async () => (n++, new Response("", { status: 404 }))) as typeof fetch;
    await expect(getJson("http://x", f)).rejects.toThrow(/404/);
    expect(n).toBe(1);
  });
});

describe("mergeRecords dedup", () => {
  it("is idempotent for identical input", async () => {
    const docs = await new FederalRegisterAdapter(ok(fx("federal-register.json"))).fetchLatest();
    const first = mergeRecords([], docs);
    const second = mergeRecords(first.records, docs);
    expect(first.inserted).toBe(3);
    expect(second.records).toHaveLength(3);
    expect(second.inserted + second.updated).toBe(0);
  });
  it("updates changed records and keeps first_seen_at", async () => {
    const [d] = await new FederalRegisterAdapter(ok(fx("federal-register.json"))).fetchLatest();
    const first = mergeRecords([], [d]);
    const r = mergeRecords(first.records, [{ ...d, title: "Changed", first_seen_at: "2030-01-01T00:00:00Z" }]);
    expect(r.updated).toBe(1);
    expect(r.records[0].title).toBe("Changed");
    expect(r.records[0].first_seen_at).toBe(d.first_seen_at);
  });
});
