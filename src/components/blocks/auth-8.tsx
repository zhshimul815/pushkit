"use client";

/**
 * Adapted from @7ovr/auth-8 (installed via the 7Ovr shadcn registry).
 * Adaptations for PushKit:
 * - Sign-up form removed. There is no registration in PushKit.
 * - Name / password / terms fields removed.
 * - Email → 6-digit OTP + magic link via Resend (POST /api/auth/request, /api/auth/verify).
 * - Staff invite links (?invite=) are accepted on this screen.
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthBlock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Internal paths only — never redirect a fresh login to an external URL.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">(invite ? "code" : "email");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!emailPattern.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { devCode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setStep("code");
      setInfo(
        data.devCode
          ? `Dev mode (no Resend key): code ${data.devCode}`
          : "Code sent. Check your email.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          invite ? { inviteToken: invite, email } : { email, code },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Bell className="mx-auto size-7 text-primary" aria-hidden />
          <CardTitle className="mt-4 text-xl font-bold tracking-tight">
            PushKit Admin
          </CardTitle>
          <CardDescription className="text-sm">
            {invite ? "Accept staff invite" : "Login with email code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={requestCode} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                  />
                  <FieldError>{error}</FieldError>
                </Field>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send login code"}
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={verify} noValidate>
              <FieldGroup>
                {invite ? (
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="staff@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="code">6-digit code</FieldLabel>
                    <Input
                      id="code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      aria-invalid={!!error}
                    />
                    <FieldError>{error}</FieldError>
                  </Field>
                )}
                {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
                {error && invite ? <FieldError>{error}</FieldError> : null}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Verifying…" : invite ? "Accept invite" : "Verify code"}
                </Button>
                {!invite ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("email")}
                  >
                    Use a different email
                  </Button>
                ) : null}
              </FieldGroup>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Restricted to authorized owner &amp; staff.
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
