/** Minimal RSS 2.0 / Atom parser — no dependencies, regex-based, feed-sized input only. */
import { assertPublicUrl } from "./metadata";

export interface FeedItem {
  guid: string;
  title: string;
  link: string;
  description: string;
}

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function atomLink(block: string): string {
  const match = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
  return match ? match[1] : "";
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of rssItems) {
    const link = tag(block, "link");
    const guid = tag(block, "guid") || link;
    if (!guid) continue;
    items.push({
      guid,
      title: tag(block, "title"),
      link,
      description: tag(block, "description").slice(0, 240),
    });
  }
  if (items.length) return items;
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of entries) {
    const link = atomLink(block);
    const guid = tag(block, "id") || link;
    if (!guid) continue;
    items.push({
      guid,
      title: tag(block, "title"),
      link,
      description: (tag(block, "summary") || tag(block, "content")).slice(0, 240),
    });
  }
  return items;
}

export interface FeedFetchResult {
  items: FeedItem[];
  etag: string | null;
  lastModified: string | null;
  notModified: boolean;
}

/** Conditional GET (optimization O5): unchanged feeds answer 304 and cost no parse. */
export async function fetchFeed(
  feedUrl: string,
  validators?: { etag?: string | null; lastModified?: string | null },
): Promise<FeedFetchResult> {
  assertPublicUrl(new URL(feedUrl));
  const headers: Record<string, string> = {
    "User-Agent": "PushKit RSS Poller",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
  };
  if (validators?.etag) headers["If-None-Match"] = validators.etag;
  if (validators?.lastModified) headers["If-Modified-Since"] = validators.lastModified;
  const res = await fetch(feedUrl, { headers, signal: AbortSignal.timeout(10000) });
  if (res.status === 304) return { items: [], etag: validators?.etag ?? null, lastModified: validators?.lastModified ?? null, notModified: true };
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  const xml = await res.text();
  return {
    items: parseFeed(xml.slice(0, 2_000_000)),
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    notModified: false,
  };
}
