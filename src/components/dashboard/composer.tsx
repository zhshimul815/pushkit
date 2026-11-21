"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Link2, Monitor, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Site, Template } from "@/lib/types";

type PreviewKind = "android" | "windows" | "macos";

export function Composer({
  sites,
  templates,
  initial,
}: {
  sites: Pick<Site, "id" | "name" | "icon_url">[];
  templates: Template[];
  initial?: Partial<Template>;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [fetchUrl, setFetchUrl] = useState("");
  const [iconUrl, setIconUrl] = useState(initial?.icon_url ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [actions, setActions] = useState<[string, string, string, string]>([
    initial?.actions?.[0]?.label ?? "",
    initial?.actions?.[0]?.url ?? "",
    initial?.actions?.[1]?.label ?? "",
    initial?.actions?.[1]?.url ?? "",
  ]);
  const [audience, setAudience] = useState({ country: "", device: "", browser: "", os: "", tagKey: "", tagValue: "" });
  const [engagedOnly, setEngagedOnly] = useState(false);
  const [inactiveDays, setInactiveDays] = useState("");
  const [utm, setUtm] = useState({ source: "pushkit", medium: "push", campaign: "" });
  const [scheduledAt, setScheduledAt] = useState("");
  const [preview, setPreview] = useState<PreviewKind>("android");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const finalUrl = useMemo(() => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      if (utm.source) parsed.searchParams.set("utm_source", utm.source);
      if (utm.medium) parsed.searchParams.set("utm_medium", utm.medium);
      if (utm.campaign) parsed.searchParams.set("utm_campaign", utm.campaign);
      return parsed.toString();
    } catch {
      return url;
    }
  }, [url, utm]);

  async function fetchMetadata() {
    if (!fetchUrl) return;
    setStatus("Fetching…");
    const res = await fetch("/api/campaigns/fetch-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fetchUrl }),
    });
    const data = (await res.json()) as {
      metadata?: { title: string; description: string; image: string; url: string };
      error?: string;
    };
    if (!res.ok || !data.metadata) {
      setStatus(data.error ?? "Fetch failed");
      return;
    }
    setTitle(data.metadata.title);
    setBody(data.metadata.description);
    setImageUrl(data.metadata.image);
    setUrl(data.metadata.url);
    setStatus("Metadata loaded");
  }

  async function upload(file: File, setter: (url: string) => void) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = (await res.json()) as { url?: string; error?: string };
    if (res.ok && data.url) setter(data.url);
    else setStatus(data.error ?? "Upload failed (R2 required)");
  }

  function buildPayload(action: "send" | "schedule" | "draft" | "template") {
    return {
      siteId,
      title,
      body,
      url: finalUrl,
      icon_url: iconUrl || undefined,
      image_url: imageUrl || undefined,
      actions: [
        { label: actions[0], url: actions[1] },
        { label: actions[2], url: actions[3] },
      ].filter((a) => a.label && a.url),
      audience: {
        ...Object.fromEntries(Object.entries(audience).filter(([, v]) => v)),
        ...(engagedOnly ? { engagedOnly: true } : {}),
        ...(inactiveDays ? { inactiveDays: Number(inactiveDays) } : {}),
      },
      action,
      scheduledAt: scheduledAt ? new Date(scheduledAt).getTime() : undefined,
      templateName: title,
    };
  }

  async function submit(action: "send" | "schedule" | "template") {
    setBusy(true);
    setStatus("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(action)),
    });
    const data = (await res.json()) as { error?: string; targets?: number };
    setBusy(false);
    if (!res.ok) {
      setStatus(data.error ?? "Failed");
      return;
    }
    if (action === "send") {
      setStatus(`Queued for ${data.targets ?? 0} subscribers`);
      router.push("/dashboard/campaigns");
    } else if (action === "schedule") {
      setStatus("Scheduled");
      router.push("/dashboard/campaigns");
    } else {
      setStatus("Saved as template");
      router.push("/dashboard/templates");
    }
    router.refresh();
  }

  const setAction = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setActions((prev) => {
      const next = [...prev] as typeof prev;
      next[index] = e.target.value;
      return next;
    });
  const setAud = (key: keyof typeof audience) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAudience((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste a URL to fetch title, description, image"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={fetchMetadata}>
              <Link2 className="size-4" /> Fetch URL Metadata
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Target Site</Label>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          {templates.length > 0 ? (
            <div className="space-y-2">
              <Label>Load Template</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === e.target.value);
                  if (!tpl) return;
                  setTitle(tpl.title);
                  setBody(tpl.body);
                  setUrl(tpl.url);
                  setIconUrl(tpl.icon_url ?? "");
                  setImageUrl(tpl.image_url ?? "");
                }}
              >
                <option value="">Select template…</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Notification title" />
          </div>
          <div className="space-y-2">
            <Label>Message Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={240} rows={3} placeholder="Notification body" />
          </div>
          <div className="space-y-2">
            <Label>Destination URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/post" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>UTM Source</Label>
              <Input value={utm.source} onChange={(e) => setUtm({ ...utm, source: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>UTM Medium</Label>
              <Input value={utm.medium} onChange={(e) => setUtm({ ...utm, medium: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>UTM Campaign</Label>
              <Input value={utm.campaign} onChange={(e) => setUtm({ ...utm, campaign: e.target.value })} />
            </div>
          </div>
          {finalUrl && finalUrl !== url ? (
            <p className="truncate text-xs text-muted-foreground">Final URL: {finalUrl}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon (URL or upload to R2)</Label>
              <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://…/icon.png" />
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], setIconUrl)} />
            </div>
            <div className="space-y-2">
              <Label>Hero Image (URL or upload to R2)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/hero.jpg" />
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], setImageUrl)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Action Button 1 — Label</Label>
              <Input value={actions[0]} onChange={setAction(0)} placeholder="Read" />
              <Label>Action Button 1 — URL</Label>
              <Input value={actions[1]} onChange={setAction(1)} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label>Action Button 2 — Label</Label>
              <Input value={actions[2]} onChange={setAction(2)} placeholder="Later" />
              <Label>Action Button 2 — URL</Label>
              <Input value={actions[3]} onChange={setAction(3)} placeholder="https://…" />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-medium">Audience</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Country (blank = All Subscribers)</Label>
                <Input value={audience.country} onChange={setAud("country")} placeholder="e.g. BD" />
              </div>
              <div className="space-y-2">
                <Label>Device</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={audience.device} onChange={setAud("device")}>
                  <option value="">All</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Browser</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={audience.browser} onChange={setAud("browser")}>
                  <option value="">All</option>
                  <option>Chrome</option>
                  <option>Firefox</option>
                  <option>Safari</option>
                  <option>Edge</option>
                  <option>Opera</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>OS</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={audience.os} onChange={setAud("os")}>
                  <option value="">All</option>
                  <option>Android</option>
                  <option>Windows</option>
                  <option>macOS</option>
                  <option>iOS</option>
                  <option>Linux</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Custom Tag — Key</Label>
                <Input value={audience.tagKey} onChange={setAud("tagKey")} placeholder="plan" />
              </div>
              <div className="space-y-2">
                <Label>Custom Tag — Value</Label>
                <Input value={audience.tagValue} onChange={setAud("tagValue")} placeholder="reader" />
              </div>
              <div className="space-y-2">
                <Label>Win-Back (not seen recently)</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={inactiveDays} onChange={(e) => setInactiveDays(e.target.value)}>
                  <option value="">Off</option>
                  <option value="7">Not seen in 7+ days</option>
                  <option value="14">Not seen in 14+ days</option>
                  <option value="30">Not seen in 30+ days</option>
                </select>
              </div>
            </div>
            <label className="flex items-start gap-2 pt-1 text-sm">
              <input type="checkbox" checked={engagedOnly} onChange={(e) => setEngagedOnly(e.target.checked)} className="mt-0.5 size-4" />
              <span>
                Engaged subscribers only
                <span className="block text-xs text-muted-foreground">
                  Clicked a notification in the last 90 days, or subscribed in the last 30 days.
                  Protects your domain from Chrome&apos;s low-engagement permission revocation.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Schedule (for Schedule action)</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => submit("send")} disabled={busy || !title || !body || !url}>
              <Send className="size-4" /> Send Now
            </Button>
            <Button variant="outline" onClick={() => submit("schedule")} disabled={busy || !scheduledAt}>
              Schedule
            </Button>
            <Button variant="outline" onClick={() => submit("template")} disabled={busy || !title}>
              Save as Template
            </Button>
          </div>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preview</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant={preview === "android" ? "default" : "ghost"} onClick={() => setPreview("android")}>
                <Smartphone className="size-4" /> Android
              </Button>
              <Button size="sm" variant={preview === "windows" ? "default" : "ghost"} onClick={() => setPreview("windows")}>
                <Monitor className="size-4" /> Windows
              </Button>
              <Button size="sm" variant={preview === "macos" ? "default" : "ghost"} onClick={() => setPreview("macos")}>
                <Monitor className="size-4" /> macOS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={
              preview === "android"
                ? "rounded-2xl border bg-muted/40 p-3"
                : "rounded-lg border bg-muted/40 p-3 shadow-sm"
            }
          >
            <div className="rounded-xl bg-background p-3 shadow-sm">
              <div className="flex items-start gap-3">
                {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrl} alt="" className="size-10 rounded-lg" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bell className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{title || "Notification title"}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {body || "Notification body"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {preview === "android" ? "Chrome · now" : preview === "windows" ? "Chrome · Windows" : "Safari · macOS"}
                    {url ? ` · ${(() => { try { return new URL(url).hostname; } catch { return url; } })()}` : ""}
                  </p>
                </div>
              </div>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="mt-3 aspect-[2/1] w-full rounded-lg object-cover" />
              ) : null}
              {actions[0] || actions[2] ? (
                <div className="mt-3 flex gap-2 border-t pt-3">
                  {[actions[0], actions[2]].filter(Boolean).map((label) => (
                    <span key={label} className="rounded-md border px-3 py-1.5 text-xs font-medium">
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
