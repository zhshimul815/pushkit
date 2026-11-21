import { Suspense } from "react";
import AuthBlock from "@/components/blocks/auth-8";

export const metadata = { title: "Admin Login — PushKit" };

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <Suspense>
        <AuthBlock />
      </Suspense>
    </main>
  );
}
