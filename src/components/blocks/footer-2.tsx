import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import {
  GITHUB_REPO_URL,
  GITHUB_BUG_REPORT_URL,
  GITHUB_FEATURE_REQUEST_URL,
  X_URL,
  X_HANDLE,
} from "@/lib/site-config";

export default function FooterBlock() {
  return (
    <footer className="w-full border-t bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:gap-12">
          {/* Column 1: Product */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/compare" className="transition hover:text-foreground">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/deploy" className="transition hover:text-foreground">
                  Deploy Guide
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="transition hover:text-foreground">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="transition hover:text-foreground">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Documentation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Documentation
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="transition hover:text-foreground">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs/wordpress" className="transition hover:text-foreground">
                  WordPress Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/migrate-from-onesignal"
                  className="transition hover:text-foreground"
                >
                  Migration Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="transition hover:text-foreground">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Community
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_BUG_REPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  Report a Bug
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_FEATURE_REQUEST_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  Request a Feature
                </a>
              </li>
              <li>
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  Follow @{X_HANDLE} on X
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`${GITHUB_REPO_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  MIT License
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  Source Code
                </a>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-foreground">
                  Dashboard Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">PushKit</span>
          </div>
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            PushKit — MIT-licensed open source. Your subscribers, your database, your Cloudflare account.
          </p>
        </div>
      </div>
    </footer>
  );
}
