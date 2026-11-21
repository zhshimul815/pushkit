import { Bell, Menu, X } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("DashboardLayout user error:", err);
  }

  if (!user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">Session expired. Redirecting to login...</p>
        <meta httpEquiv="refresh" content="0;url=/login?error=session-expired" />
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.location.replace("/login?error=session-expired");',
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r md:block">
        <DashboardNav email={user.email} role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b bg-background md:hidden">
          <details className="group">
            <summary className="flex h-14 cursor-pointer items-center justify-between px-4 font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <Bell className="size-5" aria-hidden="true" />
                <span>PushKit</span>
              </div>
              <div className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Menu className="size-5 group-open:hidden" aria-hidden="true" />
                <X className="size-5 hidden group-open:block" aria-hidden="true" />
                <span className="sr-only">Toggle navigation menu</span>
              </div>
            </summary>
            <div className="border-t bg-background">
              <DashboardNav email={user.email} role={user.role} />
            </div>
          </details>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
