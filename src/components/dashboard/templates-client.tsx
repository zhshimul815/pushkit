"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template } from "@/lib/types";

export function TemplateCard({ template }: { template: Template }) {
  const router = useRouter();

  async function remove() {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    await fetch(`/api/templates?id=${template.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">{template.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.body}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{template.url}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" render={<Link href={`/dashboard/campaigns/new?template=${template.id}`} />}>
            <Play className="size-4" /> Use Template
          </Button>
          <Button size="sm" variant="outline" onClick={remove}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
