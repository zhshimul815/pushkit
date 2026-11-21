"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Site } from "@/lib/types";

export interface SiteView extends Omit<Site, "vapid_private_key" | "webhook_secret"> {
  vapid_private_key?: string;
  webhook_secret?: string;
  subscriberCount: number;
  sent30?: number;
  clicks30?: number;
}

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-3 text-sm";
const TEXTAREA_CLASS = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function AddSiteForm({ appUrl }: { appUrl: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  void appUrl;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add site");
      return;
    }
    setName("");
    setDomain("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Site</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="site-name">Site name</Label>
            <Input id="site-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Blog" required />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="site-domain">Domain</Label>
            <Input id="site-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="blog.example.com" required />
          </div>
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" /> Add Site
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <p className="mt-3 text-sm text-muted-foreground">
          A VAPID key pair is generated for the site on create.
        </p>
      </CardContent>
    </Card>
  );
}

function SiteSettings({ site, isOwner }: { site: SiteView; isOwner: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    prompt_title: site.prompt_title,
    prompt_body: site.prompt_body,
    prompt_allow_label: site.prompt_allow_label,
    prompt_deny_label: site.prompt_deny_label,
    prompt_delay_seconds: site.prompt_delay_seconds,
    prompt_scroll_percent: site.prompt_scroll_percent ?? "",
    rss_feed_url: site.rss_feed_url ?? "",
    rss_auto_push: site.rss_auto_push === 1,
    prompt_style: site.prompt_style || "banner",
    prompt_texts: site.prompt_texts ?? "",
    prompt_ab_enabled: site.prompt_ab_enabled === 1,
    prompt_b_title: site.prompt_b_title ?? "",
    prompt_b_body: site.prompt_b_body ?? "",
    welcome_enabled: site.welcome_enabled === 1,
    welcome_title: site.welcome_title ?? "",
    welcome_body: site.welcome_body ?? "",
    welcome_url: site.welcome_url ?? "",
    migration_from: site.migration_from ?? "",
    max_per_day: site.max_per_day,
    min_hours_between_sends: site.min_hours_between_sends,
  });
  const [status, setStatus] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        prompt_scroll_percent: form.prompt_scroll_percent === "" ? null : Number(form.prompt_scroll_percent),
        prompt_delay_seconds: Number(form.prompt_delay_seconds),
        max_per_day: Number(form.max_per_day),
        min_hours_between_sends: Number(form.min_hours_between_sends),
        rss_feed_url: form.rss_feed_url || null,
        prompt_texts: form.prompt_texts || null,
        prompt_b_title: form.prompt_b_title || null,
        prompt_b_body: form.prompt_b_body || null,
        welcome_title: form.welcome_title || null,
        welcome_body: form.welcome_body || null,
        welcome_url: form.welcome_url || null,
        migration_from: form.migration_from || null,
      }),
    });
    setStatus(res.ok ? "Saved" : "Save failed");
    if (res.ok) router.refresh();
  }

  async function rotate(target: "webhook" | "vapid") {
    if (!confirm(`Rotate ${target === "vapid" ? "VAPID keys" : "webhook secret"}? ${target === "vapid" ? "Existing subscriptions stop working." : ""}`)) return;
    const res = await fetch(`/api/sites/${site.id}/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setStatus(res.ok ? "Rotated" : "Rotate failed");
    if (res.ok) router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete site ${site.domain}? Subscribers and campaigns are deleted.`)) return;
    const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
    }));

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Prompt title</Label>
          <Input value={form.prompt_title} onChange={set("prompt_title")} />
        </div>
        <div className="space-y-2">
          <Label>Prompt description</Label>
          <Input value={form.prompt_body} onChange={set("prompt_body")} />
        </div>
        <div className="space-y-2">
          <Label>Allow button label</Label>
          <Input value={form.prompt_allow_label} onChange={set("prompt_allow_label")} />
        </div>
        <div className="space-y-2">
          <Label>Deny button label</Label>
          <Input value={form.prompt_deny_label} onChange={set("prompt_deny_label")} />
        </div>
        <div className="space-y-2">
          <Label>Trigger delay (seconds)</Label>
          <Input type="number" min={0} value={form.prompt_delay_seconds} onChange={set("prompt_delay_seconds")} />
        </div>
        <div className="space-y-2">
          <Label>Or trigger at scroll % (optional)</Label>
          <Input type="number" min={1} max={100} value={form.prompt_scroll_percent} onChange={set("prompt_scroll_percent")} placeholder="e.g. 50" />
        </div>
      </div>
      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>RSS / Atom feed URL</Label>
          <Input value={form.rss_feed_url} onChange={set("rss_feed_url")} placeholder="https://example.com/feed" />
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input type="checkbox" checked={form.rss_auto_push} onChange={set("rss_auto_push")} className="size-4" />
          Auto-Push New Posts
        </label>
      </div>
      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-medium">Prompt Style, Languages &amp; A/B Test</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prompt style</Label>
            <select className={SELECT_CLASS} value={form.prompt_style} onChange={set("prompt_style")}>
              <option value="banner">Banner card (top center)</option>
              <option value="bar">Top bar</option>
              <option value="bell">Bell button (bottom left)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" checked={form.prompt_ab_enabled} onChange={set("prompt_ab_enabled")} className="size-4" />
            A/B test prompt text (50/50 split)
          </label>
          <div className="space-y-2">
            <Label>Variant B — title</Label>
            <Input value={form.prompt_b_title} onChange={set("prompt_b_title")} placeholder="Alternative prompt title" />
          </div>
          <div className="space-y-2">
            <Label>Variant B — description</Label>
            <Input value={form.prompt_b_body} onChange={set("prompt_b_body")} placeholder="Alternative prompt description" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Prompt texts by language (JSON, optional)</Label>
          <textarea
            className={TEXTAREA_CLASS}
            rows={3}
            value={form.prompt_texts}
            onChange={set("prompt_texts")}
            placeholder={'{"bn":{"title":"…","body":"…","allow":"…","deny":"…"}}'}
          />
          <p className="text-xs text-muted-foreground">
            The SDK already ships built-in Bangla, Hindi, Spanish and Portuguese prompt texts and
            picks by the visitor&apos;s browser language. Use this JSON to override any language.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-medium">Welcome Notification</h4>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.welcome_enabled} onChange={set("welcome_enabled")} className="size-4" />
          Send a welcome notification to every new subscriber
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Welcome title</Label>
            <Input value={form.welcome_title} onChange={set("welcome_title")} placeholder="You're subscribed" />
          </div>
          <div className="space-y-2">
            <Label>Welcome message</Label>
            <Input value={form.welcome_body} onChange={set("welcome_body")} placeholder="Thanks for subscribing." />
          </div>
          <div className="space-y-2">
            <Label>Welcome click URL</Label>
            <Input value={form.welcome_url} onChange={set("welcome_url")} placeholder="https://…" />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-medium">Send Pacing &amp; Migration</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Max notifications per subscriber per day (0 = off)</Label>
            <Input type="number" min={0} max={20} value={form.max_per_day} onChange={set("max_per_day")} />
          </div>
          <div className="space-y-2">
            <Label>Minimum hours between sends to one subscriber (0 = off)</Label>
            <Input type="number" min={0} max={168} value={form.min_hours_between_sends} onChange={set("min_hours_between_sends")} />
          </div>
          <div className="space-y-2">
            <Label>Migrating from</Label>
            <select className={SELECT_CLASS} value={form.migration_from} onChange={set("migration_from")}>
              <option value="">Not migrating</option>
              <option value="onesignal">OneSignal</option>
              <option value="pushengage">PushEngage</option>
              <option value="larapush">LaraPush</option>
            </select>
            <p className="text-xs text-muted-foreground">
              The SDK silently re-subscribes returning visitors under this site&apos;s VAPID key —
              see the migration guide on the Subscribers page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm">Save settings</Button>
        {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        {isOwner ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => rotate("webhook")}>
              <RefreshCw className="size-4" /> Rotate webhook secret
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => rotate("vapid")}>
              <RefreshCw className="size-4" /> Rotate VAPID keys
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={remove}>
              <Trash2 className="size-4" /> Delete site
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
}

export function SiteCard({
  site,
  appUrl,
  isOwner,
}: {
  site: SiteView;
  appUrl: string;
  isOwner: boolean;
}) {
  const snippet = `<script src="${appUrl}/sdk.js" data-site-id="${site.id}" async></script>`;
  const webhookUrl = `${appUrl}/api/webhooks/publish/${site.id}`;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{site.name}</CardTitle>
          <span className="flex flex-wrap gap-2">
            <Badge variant="secondary">{site.subscriberCount.toLocaleString()} subscribers</Badge>
            {site.sent30 ? (
              <Badge variant="outline">
                30d CTR {site.sent30 > 0 ? Math.round(((site.clicks30 ?? 0) / site.sent30) * 1000) / 10 : 0}%
                {site.sent30 > 5000 && (site.clicks30 ?? 0) / site.sent30 < 0.01 ? " — low engagement risk" : ""}
              </Badge>
            ) : null}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{site.url}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-medium">Integration</h3>
          <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-nowrap">
            {snippet}
          </code>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyButton text={snippet} label="Copy snippet" />
            <Button render={<a href={`/sw.js?siteId=${site.id}&download=1`} download="sw.js" />} size="sm" variant="outline">
              <Download className="size-4" /> Download sw.js
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Place sw.js at the root of {site.domain} (https://{site.domain}/sw.js).
          </p>
        </section>

        <section className="border-t pt-4">
          <h3 className="mb-2 text-sm font-medium">VAPID Keys</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">VAPID Public Key: </span>
              <code className="font-mono text-xs break-all">{site.vapid_public_key}</code>
            </div>
            {isOwner && site.vapid_private_key ? (
              <div>
                <span className="text-muted-foreground">VAPID Private Key: </span>
                <code className="font-mono text-xs break-all">{site.vapid_private_key}</code>
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t pt-4">
          <h3 className="mb-2 text-sm font-medium">Publish Webhook</h3>
          <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-nowrap">
            POST {webhookUrl}
          </code>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton text={webhookUrl} label="Copy webhook URL" />
            {isOwner && site.webhook_secret ? (
              <>
                <span className="text-sm text-muted-foreground">Secret:</span>
                <code className="font-mono text-xs break-all">{site.webhook_secret}</code>
                <CopyButton text={site.webhook_secret} label="Copy secret" />
              </>
            ) : null}
          </div>
        </section>

        <section className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium">Opt-In Prompt &amp; Auto-Push</h3>
          <SiteSettings site={site} isOwner={isOwner} />
        </section>
      </CardContent>
    </Card>
  );
}
