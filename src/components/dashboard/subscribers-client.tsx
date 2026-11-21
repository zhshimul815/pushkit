"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-3 text-sm";

export function DeleteSubscriberButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm("Delete this subscriber?")) return;
    setBusy(true);
    const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }
  return (
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={remove} aria-label="Delete subscriber">
      <Trash2 className="size-4" />
    </Button>
  );
}

export function ImportCard({ sites }: { sites: { id: string; name: string }[] }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [source, setSource] = useState("onesignal");
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!siteId || !csv) { setStatus("Choose a site and a CSV file first"); return; }
    setBusy(true);
    setStatus("Importing…");
    const res = await fetch("/api/subscribers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, source, csv }),
    });
    const data = (await res.json()) as { error?: string; inserted?: number; skipped?: number; invalid?: number; total?: number };
    setBusy(false);
    if (!res.ok) { setStatus(data.error ?? "Import failed"); return; }
    setStatus(
      `Imported ${data.inserted} audience records (${data.skipped} already present, ${data.invalid} invalid rows skipped, ${data.total} rows in file). ` +
      "They become sendable as their browsers re-subscribe under this site's VAPID key.",
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import &amp; Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Site</Label>
            <select className={SELECT_CLASS} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Exported from</Label>
            <select className={SELECT_CLASS} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="onesignal">OneSignal</option>
              <option value="pushengage">PushEngage</option>
              <option value="generic">Generic CSV (endpoint, p256dh, auth)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>CSV file</Label>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="block w-full text-sm" />
            {fileName ? <p className="text-xs text-muted-foreground">{fileName}</p> : null}
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy}>
              <Upload className="size-4" /> Import CSV
            </Button>
            {status ? <p className="mt-2 text-sm text-muted-foreground">{status}</p> : null}
          </div>
        </form>

        <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How migration works — read this first</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              A push subscription is cryptographically bound to the VAPID key it was created with.
              Exported endpoints <span className="font-medium text-foreground">cannot</span> receive
              sends from PushKit&apos;s keys — any tool that promises a pure file-import migration
              is leaving this out.
            </li>
            <li>
              The import above stores your old audience as records (marked{" "}
              <span className="font-medium text-foreground">Awaiting re-subscribe</span>), so you can
              see how much of the list has converted.
            </li>
            <li>
              Install the PushKit snippet and sw.js on the site, and set{" "}
              <span className="font-medium text-foreground">Migrating from</span> in the site&apos;s
              settings. When a returning visitor who already granted notification permission loads
              any page, the SDK silently re-subscribes them under PushKit — no prompt, no click.
              That record flips to deliverable automatically.
            </li>
            <li>
              Visitors who never return cannot be recovered by any provider switch — plan a
              re-engagement push on the old provider (&ldquo;we&apos;ve moved — visit to keep
              getting updates&rdquo;) before you cancel it.
            </li>
            <li>
              Keep the old provider active until the re-subscribed count plateaus (typically 2–4
              weeks of normal traffic), then cancel.
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
