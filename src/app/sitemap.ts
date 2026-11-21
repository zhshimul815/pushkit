import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/compare",
    "/deploy",
    "/docs",
    "/docs/wordpress",
    "/docs/migrate-from-onesignal",
    "/docs/api",
    "/roadmap",
    "/changelog",
  ];

  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/changelog" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/docs") || route === "/compare" ? 0.8 : 0.6,
  }));
}
