import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r md:block">
        <DashboardNav email={user.email} role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b md:hidden">
          <details>
            <summary className="flex h-14 cursor-pointer items-center px-4 font-semibold">
              PushKit — Menu
            </summary>
            <div className="border-t">
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
