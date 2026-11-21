import Link from "next/link";
import { Bell } from "lucide-react";
import FooterBlock from "@/components/blocks/footer-2";
import { Button } from "@/components/ui/button";
import { GitHubIcon, XIcon } from "@/components/icons";
import { GITHUB_REPO_URL, X_URL } from "@/lib/site-config";

export const GITHUB_URL = GITHUB_REPO_URL;

/** Capacity of one PushKit install on the Cloudflare Free Tier. */
export const CAPACITY_STATS = [
  { value: "≈130,000", label: "Pushes per day" },
  { value: "≈4,000,000", label: "Pushes per month" },
  { value: "1,000,000+", label: "Subscribers stored" },
  { value: "Unlimited", label: "Sites" },
  { value: "$0", label: "Per month" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Bell className="size-5 text-primary" />
          <span>PushKit</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/compare" className="transition hover:text-foreground">
            Compare
          </Link>
          <Link href="/deploy" className="transition hover:text-foreground">
            Deploy
          </Link>
          <Link href="/docs" className="transition hover:text-foreground">
            Docs
          </Link>
          <Link href="/roadmap" className="transition hover:text-foreground">
            Roadmap
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <GitHubIcon className="size-4" />
            <span className="hidden lg:inline font-mono">Star</span>
          </a>
          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Yang Kai on X"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </a>
          <Button size="sm" variant="outline" className="hidden sm:inline-flex" render={<Link href="/deploy" />}>
            Deploy Guide
          </Button>
          <Button size="sm" render={<Link href="/login" />}>
            Dashboard
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return <FooterBlock />;
}
