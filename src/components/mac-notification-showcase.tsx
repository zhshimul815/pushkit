import { WordPressIcon } from "@/components/icons";
import { Apple, Wifi, Search, SlidersHorizontal, BatteryCharging } from "lucide-react";

export function MacNotificationShowcase() {
  return (
    <section className="border-y bg-secondary/30 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Subscriber Experience
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          What your readers actually see
        </h2>
        <p className="mt-3 text-muted-foreground sm:text-base">
          Native, zero-friction delivery right to your reader&apos;s desktop or phone. No app install required, no middleware latency — sent directly from your Cloudflare edge queue to Apple, Google, and Mozilla push services.
        </p>
      </div>

      {/* Mac Monitor Frame */}
      <div className="mt-12 mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
          {/* Mac Top Camera Notch / Bezel */}
          <div className="flex h-5 items-center justify-center bg-neutral-950 px-4">
            <span className="size-2 rounded-full bg-neutral-800 ring-1 ring-neutral-700" />
          </div>

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
          <div className="relative h-[420px] sm:h-[460px] w-full overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/70 to-purple-950/80 p-4 sm:p-6">
            {/* Subtle macOS wallpaper ambient glow elements */}
            <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-purple-600/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/3 size-64 rounded-full bg-amber-500/10 blur-3xl" />

            {/* Desktop Dock Hint at bottom */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white shadow">
                <WordPressIcon className="size-4" />
              </span>
              <span className="size-7 rounded-lg bg-emerald-500 shadow" />
              <span className="size-7 rounded-lg bg-amber-500 shadow" />
              <span className="size-7 rounded-lg bg-indigo-500 shadow" />
              <span className="size-7 rounded-lg bg-rose-500 shadow" />
            </div>

            {/* Push Notifications Container — positioned top right like native macOS */}
            <div className="relative z-10 flex flex-col items-end gap-3 sm:gap-3.5 sm:max-w-md ml-auto">
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

              {/* Notification 2: Core Update / Newsletter Alert */}
              <div className="w-full rounded-2xl border border-white/15 bg-neutral-900/85 p-3.5 text-neutral-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:scale-[1.01]">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-900/50 p-1.5 ring-1 ring-sky-500/30 shadow-inner">
                    <WordPressIcon className="size-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-neutral-200">
                        WordPress Security
                      </p>
                      <span className="shrink-0 text-[10px] text-neutral-400">
                        Chrome · 5m ago
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-white leading-snug">
                      WordPress 6.7.1 Security &amp; Maintenance Release
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-300 leading-relaxed">
                      Maintenance update addressing 2 core vulnerabilities. 1-click update is ready on your dashboard.
                    </p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                      <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20">
                        View Changelog
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mac Monitor Chin Stand */}
        <div className="mx-auto h-3 w-40 rounded-b-lg bg-neutral-800 shadow-md" />
        <div className="mx-auto h-8 w-24 bg-gradient-to-b from-neutral-700 to-neutral-800 shadow-inner" />
        <div className="mx-auto h-2 w-48 rounded-full bg-neutral-700/80 shadow-md" />
      </div>
      </div>
    </section>
  );
}
