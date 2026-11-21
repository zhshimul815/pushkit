import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const GITHUB_URL = "https://github.com/zhshimul815/pushkit";

const NAV_LINKS = [
  { label: "Deploy Guide", href: "/deploy" },
  { label: "Compare", href: "/compare" },
  { label: "GitHub", href: GITHUB_URL, external: true },
  { label: "Dashboard", href: "/login" },
];

export default function FooterBlock() {
  return (
    <section className="flex w-full flex-col items-stretch bg-background text-foreground">
      <Separator />
      <footer className="w-full px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="size-6 shrink-0 text-primary"
            >
              <rect
                x="3"
                y="3"
                width="8"
                height="8"
                transform="rotate(-6 7 7)"
              />
              <rect
                x="3"
                y="13"
                width="8"
                height="8"
                transform="rotate(5 7 17)"
              />
              <rect
                x="13"
                y="13"
                width="8"
                height="8"
                transform="rotate(-4 17 17)"
              />
              <rect
                x="13"
                y="3"
                width="8"
                height="8"
                transform="rotate(15 17 7)"
              />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">PushKit</span>
              <span className="text-xs text-muted-foreground">
                Self-hosted web push notifications.
              </span>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-5 gap-y-1"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="shrink-0 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PushKit. ELv2 License.
          </p>
        </div>
      </footer>
    </section>
  );
}
