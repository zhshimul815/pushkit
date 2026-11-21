"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { devUrl?: string; error?: string };
    if (!res.ok) {
      setStatus(data.error ?? "Invite failed");
      return;
    }
    setStatus(data.devUrl ? `Dev invite link: ${data.devUrl}` : "Invite sent");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="invite-email">Staff email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
          required
        />
      </div>
      <Button type="submit">Send Invite</Button>
      {status ? <p className="text-sm text-muted-foreground break-all">{status}</p> : null}
    </form>
  );
}

export function RevokeButton({ userId, sessionId, label }: { userId?: string; sessionId?: string; label: string }) {
  const router = useRouter();
  async function revoke() {
    if (!confirm(`${label}?`)) return;
    const query = userId ? `userId=${userId}` : `sessionId=${sessionId}`;
    await fetch(`/api/team?${query}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button size="sm" variant="outline" onClick={revoke}>
      {label}
    </Button>
  );
}

export function PurgeButton() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  async function purge() {
    if (!confirm("Purge subscribers not seen in 180 days?")) return;
    const res = await fetch("/api/settings/purge", { method: "POST" });
    const data = (await res.json()) as { purged?: number; error?: string };
    setStatus(res.ok ? `Purged ${data.purged ?? 0} subscribers` : (data.error ?? "Purge failed"));
    router.refresh();
  }
  return (
    <span className="flex items-center gap-3">
      <Button variant="outline" onClick={purge}>Purge Expired Endpoints</Button>
      {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
    </span>
  );
}

interface EmailStatus {
  configured: boolean;
  source: "settings" | "environment" | null;
  keyHint: string | null;
  from: string;
}

export function EmailSettingsForm({ initial }: { initial: EmailStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<EmailStatus>(initial);
  const [apiKey, setApiKey] = useState("");
  const [from, setFrom] = useState(initial.from);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, from }),
    });
    const data = (await res.json()) as EmailStatus & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }
    setStatus(data);
    setApiKey("");
    setMessage("Saved. The key is stored encrypted in your D1 database.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remove the saved Resend API key?")) return;
    setBusy(true);
    const res = await fetch("/api/settings/email", { method: "DELETE" });
    const data = (await res.json()) as EmailStatus;
    setBusy(false);
    if (res.ok) {
      setStatus(data);
      setFrom(data.from);
      setMessage(
        data.configured
          ? "Saved key removed. The RESEND_API_KEY environment secret is now active."
          : "Saved key removed. No Resend API key is configured.",
      );
      router.refresh();
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/settings/email/test", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; to?: string; error?: string };
    setBusy(false);
    setMessage(
      res.ok
        ? `Test email sent to ${data.to}. Check the inbox.`
        : (data.error ?? "Test email failed"),
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="text-muted-foreground">Status: </span>
        {status.configured ? (
          <>
            Configured — key ending <span className="font-mono">••••{status.keyHint}</span>{" "}
            <span className="text-muted-foreground">
              ({status.source === "settings" ? "saved in Settings" : "RESEND_API_KEY environment secret"})
            </span>
          </>
        ) : (
          "Not configured. Login codes cannot be emailed."
        )}
      </p>
      <form onSubmit={save} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="resend-key">Resend API Key</Label>
          <Input
            id="resend-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="re_..."
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resend-from">From Address</Label>
          <Input
            id="resend-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="PushKit <auth@example.com>"
          />
          <p className="text-xs text-muted-foreground">
            The domain must be verified in Resend. Get a key at resend.com → API Keys.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            Save API Key
          </Button>
          <Button type="button" variant="outline" disabled={busy || !status.configured} onClick={sendTest}>
            Send Test Email
          </Button>
          {status.source === "settings" ? (
            <Button type="button" variant="outline" disabled={busy} onClick={remove}>
              Remove Saved Key
            </Button>
          ) : null}
        </div>
      </form>
      {message ? <p className="text-sm text-muted-foreground break-all">{message}</p> : null}
    </div>
  );
}
