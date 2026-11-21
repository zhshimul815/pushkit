/** Tiny user-agent parser for subscriber breakdowns. No dependency. */

export interface ParsedUa {
  browser: string;
  os: string;
  device: "mobile" | "tablet" | "desktop";
}

export function parseUserAgent(ua: string): ParsedUa {
  const s = ua.toLowerCase();
  let browser = "Other";
  if (s.includes("edg/")) browser = "Edge";
  else if (s.includes("opr/") || s.includes("opera")) browser = "Opera";
  else if (s.includes("firefox")) browser = "Firefox";
  else if (s.includes("chrome") || s.includes("crios")) browser = "Chrome";
  else if (s.includes("safari")) browser = "Safari";

  let os = "Other";
  if (s.includes("android")) os = "Android";
  else if (s.includes("iphone") || s.includes("ipad")) os = "iOS";
  else if (s.includes("windows")) os = "Windows";
  else if (s.includes("mac os")) os = "macOS";
  else if (s.includes("linux")) os = "Linux";

  let device: ParsedUa["device"] = "desktop";
  if (s.includes("ipad") || s.includes("tablet")) device = "tablet";
  else if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) device = "mobile";

  return { browser, os, device };
}
