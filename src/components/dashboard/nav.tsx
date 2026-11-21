"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Globe,
  LayoutDashboard,
  LogOut,
  LayoutTemplate,
  MailPlus,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sites", label: "Sites", icon: Globe },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Bell },
  { href: "/dashboard/campaigns/new", label: "New Campaign", icon: MailPlus },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hidden h-14 items-center gap-2 border-b px-4 font-semibold md:flex">
        <Bell className="size-5" aria-hidden /> PushKit
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href) &&
                !(link.href === "/dashboard/campaigns" && pathname === "/dashboard/campaigns/new");
          return (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon className="size-4" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <p className="truncate px-3 text-sm font-medium">{email}</p>
        <p className="px-3 text-xs text-muted-foreground capitalize">{role}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden /> Logout
        </button>
      </div>
    </div>
  );
}
