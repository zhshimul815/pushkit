/** Scrape Open Graph metadata from a URL to pre-fill the campaign composer. */

export interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function metaContent(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]);
  }
  return "";
}

/** SSRF guard: only public http(s) targets — no localhost, no private or
 *  reserved IP literals, and every redirect hop is re-validated. */
export function assertPublicUrl(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("URL must be http(s)");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("URL host is not public");
  }
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    const blocked =
      a === 0 || a === 10 || a === 127 || // this-network, private, loopback
      (a === 172 && b >= 16 && b <= 31) || // private
      (a === 192 && b === 168) || // private
      (a === 169 && b === 254) || // link-local (cloud metadata)
      (a === 100 && b >= 64 && b <= 127) || // CGNAT shared space
      a >= 224; // multicast + reserved
    if (blocked) throw new Error("URL host is not public");
  }
  if (host.includes(":")) {
    // IPv6 literal: allow only globally routable (2xxx) addresses.
    if (!/^2[0-9a-f]{3}:/.test(host)) throw new Error("URL host is not public");
  }
}

export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata> {
  let url = new URL(rawUrl);
  assertPublicUrl(url);
  let res: Response | null = null;
  for (let hop = 0; hop <= 3; hop++) {
    res = await fetch(url.toString(), {
      headers: { "User-Agent": "PushKit Metadata Fetcher" },
      signal: AbortSignal.timeout(10000),
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
      assertPublicUrl(url);
      continue;
    }
    break;
  }
  if (!res) throw new Error("Fetch failed");
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status}`);
  const html = (await res.text()).slice(0, 500_000);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return {
    title: metaContent(html, "og:title") || (titleTag ? decodeEntities(titleTag[1]) : ""),
    description: metaContent(html, "og:description") || metaContent(html, "description"),
    image: metaContent(html, "og:image"),
    url: res.url || url.toString(),
  };
}
