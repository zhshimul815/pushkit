import Link from "next/link";
import { BookOpen, Layers, ArrowLeftRight, Code2, Rocket, HelpCircle } from "lucide-react";
import { GITHUB_BUG_REPORT_URL, GITHUB_DISCUSSIONS_URL, X_URL } from "@/lib/site-config";

const DOCS_NAV = [
  { href: "/docs", label: "Overview & Quickstart", icon: BookOpen },
  { href: "/deploy", label: "Cloudflare Deploy Guide", icon: Rocket },
  { href: "/docs/wordpress", label: "WordPress Plugin Guide", icon: Layers },
  { href: "/docs/migrate-from-onesignal", label: "Migrate from OneSignal", icon: ArrowLeftRight },
  { href: "/docs/api", label: "Web Push API Reference", icon: Code2 },
];

export function DocsSidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="sticky top-20 flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documentation
          </h2>
          <nav className="mt-3 flex flex-col gap-1">
            {DOCS_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <HelpCircle className="size-4 text-primary" />
            <span>Need Help?</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            PushKit is open source. Get help directly from the community.
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-xs">
            <a
              href={GITHUB_BUG_REPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              • Report a bug on GitHub
            </a>
            <a
              href={GITHUB_DISCUSSIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              • Ask in Discussions
            </a>
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              • Message Yang Kai on X
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
