import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GITHUB_URL = "https://github.com/zhshimul815/pushkit";

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
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Bell className="size-5" />
          PushKit
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#product" className="hover:text-foreground">Product</Link>
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/compare" className="hover:text-foreground">Compare</Link>
          <Link href="/#capacity" className="hover:text-foreground">Capacity</Link>
          <Link href="/deploy" className="hover:text-foreground">Deploy Guide</Link>
          <a href={GITHUB_URL} className="hover:text-foreground">GitHub</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="hidden sm:inline-flex" render={<Link href="/deploy" />}>Deploy Guide</Button>
          <Button size="sm" render={<Link href="/login" />}>Admin Login</Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Bell className="size-4" />
          PushKit
        </span>
        <span>MIT License</span>
        <Link href="/deploy" className="hover:text-foreground">Deploy Guide</Link>
        <a href={GITHUB_URL} className="hover:text-foreground">GitHub</a>
        <Link href="/login" className="hover:text-foreground">Admin Login</Link>
      </div>
    </footer>
  );
}
