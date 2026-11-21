"use client";

import { useState } from "react";
import {
  WordPressIcon,
  AppStoreIcon,
  ChromeIcon,
  NotionIcon,
  VSCodeIcon,
  SpotifyIcon,
} from "@/components/icons";
import {
  Apple,
  Wifi,
  Search,
  SlidersHorizontal,
  BatteryCharging,
  Bluetooth,
  BellOff,
  Plane,
  Laptop,
  Smartphone,
} from "lucide-react";

export function MacNotificationShowcase() {
  const [screenMode, setScreenMode] = useState<"desktop" | "mobile">("desktop");
  const isMobile = screenMode === "mobile";

  return (
    <section className="border-y bg-secondary/30 py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Subscriber Experience
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            What your readers actually see
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-base">
            Delivered directly to desktop and mobile browsers. No mobile app install required — sent directly from your Cloudflare queue to Apple, Google, and Mozilla push services.
          </p>

          {/* Device Screen Switcher */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex items-center rounded-lg border bg-background/80 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setScreenMode("desktop")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  !isMobile
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="size-3.5" /> Desktop Screen
              </button>
              <button
                type="button"
                onClick={() => setScreenMode("mobile")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isMobile
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-3.5" /> Mobile Screen
              </button>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* DESKTOP SCREEN PREVIEW                                        */}
        {/* -------------------------------------------------------------- */}
        {!isMobile ? (
          <div className="mt-10 mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
              {/* macOS Menu Bar */}
              <div className="flex h-7 items-center justify-between border-b border-white/10 bg-black/40 px-3 text-[11px] font-medium text-white/90 backdrop-blur-md">
                <div className="flex items-center gap-3.5">
                  <Apple className="size-3.5 fill-current" />
                  <span className="font-semibold">Finder</span>
                  <span className="hidden sm:inline opacity-80">File</span>
                  <span className="hidden sm:inline opacity-80">Edit</span>
                  <span className="hidden sm:inline opacity-80">View</span>
                  <span className="hidden sm:inline opacity-80">Go</span>
                  <span className="hidden md:inline opacity-80">Window</span>
                  <span className="hidden md:inline opacity-80">Help</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/80">
                  <BatteryCharging className="size-3.5" />
                  <Wifi className="size-3.5" />
                  <Search className="size-3.5" />
                  <SlidersHorizontal className="size-3.5" />
                  <span className="text-[11px] font-normal tracking-tight">Fri Nov 21 8:30 PM</span>
                </div>
              </div>

              {/* Desktop Wallpaper with Notifications */}
              <div className="relative h-[440px] sm:h-[480px] w-full overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/70 to-purple-950/80 p-4 sm:p-6">
                {/* Subtle macOS wallpaper ambient glow elements */}
                <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-blue-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-purple-600/20 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/3 size-64 rounded-full bg-amber-500/10 blur-3xl" />

                {/* macOS Dock with the 5 Icons */}
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-3.5 py-2 backdrop-blur-xl shadow-2xl">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 p-1 transition hover:scale-110 shadow">
                    <AppStoreIcon className="size-7" />
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 p-1 transition hover:scale-110 shadow">
                    <ChromeIcon className="size-7" />
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white p-1 transition hover:scale-110 shadow">
                    <NotionIcon className="size-6 text-black" />
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 p-1 transition hover:scale-110 shadow">
                    <VSCodeIcon className="size-7" />
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 p-1 transition hover:scale-110 shadow">
                    <SpotifyIcon className="size-7" />
                  </span>
                </div>

                {/* Push Notifications Container — positioned top right like native macOS */}
                <div className="relative z-10 flex flex-col items-end gap-3.5 sm:max-w-md ml-auto">
                  {/* Notification 1: High Priority Post Alert */}
                  <div className="w-full rounded-2xl border border-white/15 bg-neutral-900/85 p-3.5 text-neutral-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:scale-[1.01]">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-900/50 p-1.5 ring-1 ring-sky-500/30 shadow-inner">
                        <WordPressIcon className="size-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-neutral-200">
                            WP Tech Daily
                          </p>
                          <span className="shrink-0 text-[10px] text-neutral-400">
                            Safari · now
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-white leading-snug">
                          10 Ways to Scale WordPress with Cloudflare Workers
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-300 leading-relaxed">
                          Sub-50ms TTFB worldwide with zero egress costs, smart edge caching, and automated web push broadcasts.
                        </p>
                        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                          <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20">
                            Read Article
                          </span>
                          <span className="rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:text-neutral-200">
                            Later
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification 2: Blog Post Alert */}
                  <div className="w-full rounded-2xl border border-white/15 bg-neutral-900/85 p-3.5 text-neutral-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:scale-[1.01]">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-900/50 p-1.5 ring-1 ring-sky-500/30 shadow-inner">
                        <WordPressIcon className="size-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-neutral-200">
                            WP Tech Daily
                          </p>
                          <span className="shrink-0 text-[10px] text-neutral-400">
                            Chrome · 12m ago
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-white leading-snug">
                          How to Build an E-Commerce Store with WooCommerce &amp; Next.js
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-300 leading-relaxed">
                          Full architecture guide: edge checkout sessions, webhooks, and sub-second catalog search.
                        </p>
                        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                          <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20">
                            Read Article
                          </span>
                          <span className="rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:text-neutral-200">
                            Later
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* -------------------------------------------------------------- */
          /* MOBILE NOTIFICATION PANEL PREVIEW (Sample Screen, No Mockup)  */
          /* -------------------------------------------------------------- */
          <div className="mt-10 mx-auto max-w-sm">
            <div className="overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-950 p-4 shadow-2xl ring-1 ring-white/10 text-white">
              {/* Status Bar */}
              <div className="flex items-center justify-between px-1 text-xs text-neutral-400 font-medium">
                <span>9:41</span>
                <div className="flex items-center gap-2 text-neutral-300">
                  <Wifi className="size-3.5" />
                  <span className="text-[10px] font-semibold">5G</span>
                  <BatteryCharging className="size-3.5" />
                </div>
              </div>

              {/* 4 Quick Settings Tiles */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center justify-center rounded-xl bg-blue-600/90 py-2.5 px-1 shadow text-white">
                  <Wifi className="size-4" />
                  <span className="mt-1 text-[10px] font-semibold truncate">Wi-Fi</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-blue-600/90 py-2.5 px-1 shadow text-white">
                  <Bluetooth className="size-4" />
                  <span className="mt-1 text-[10px] font-semibold truncate">Bluetooth</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-800/80 py-2.5 px-1 text-neutral-300">
                  <BellOff className="size-4" />
                  <span className="mt-1 text-[10px] font-medium truncate">Silent</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-800/80 py-2.5 px-1 text-neutral-300">
                  <Plane className="size-4" />
                  <span className="mt-1 text-[10px] font-medium truncate">Airplane</span>
                </div>
              </div>

              {/* Notification Center List */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Notifications
                  </span>
                  <span className="text-[11px] text-neutral-500">Clear all</span>
                </div>

                {/* Mobile Notification Card 1 */}
                <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-900/50 p-1 ring-1 ring-sky-500/30">
                      <WordPressIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-neutral-300 truncate">WP Tech Daily</p>
                        <span className="text-[10px] text-neutral-500 shrink-0">Chrome · now</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-white leading-tight">
                        10 Ways to Scale WordPress with Cloudflare Workers
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-400 line-clamp-2 leading-snug">
                        Sub-50ms TTFB worldwide with zero egress costs, smart edge caching, and automated web push broadcasts.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2">
                        <span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white">
                          Read Article
                        </span>
                        <span className="rounded-md px-2 py-1 text-[10px] font-medium text-neutral-400">
                          Later
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Notification Card 2 */}
                <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-900/50 p-1 ring-1 ring-sky-500/30">
                      <WordPressIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-neutral-300 truncate">WP Tech Daily</p>
                        <span className="text-[10px] text-neutral-500 shrink-0">Chrome · 12m ago</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-white leading-tight">
                        How to Build an E-Commerce Store with WooCommerce &amp; Next.js
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-400 line-clamp-2 leading-snug">
                        Full architecture guide: edge checkout sessions, webhooks, and sub-second catalog search.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2">
                        <span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white">
                          Read Article
                        </span>
                        <span className="rounded-md px-2 py-1 text-[10px] font-medium text-neutral-400">
                          Later
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
