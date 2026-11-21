import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <p className="text-muted-foreground">Page not found.</p>
      <Button render={<Link href="/" />}>Back to home</Button>
    </main>
  );
}
