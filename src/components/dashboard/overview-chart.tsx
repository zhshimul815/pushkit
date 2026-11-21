"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

interface Point {
  day: string;
  subscribers: number;
  sent: number;
  clicks: number;
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

const emptySubscribe = () => () => {};

export function OverviewChart({ series }: { series: Point[] }) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [days, setDays] = useState<number>(30);

  if (!isClient) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center text-sm text-muted-foreground">
        Loading chart...
      </div>
    );
  }

  const data = series.slice(-days);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {RANGES.map((range) => (
          <Button
            key={range.label}
            size="sm"
            variant={days === range.days ? "default" : "outline"}
            onClick={() => setDays(range.days)}
          >
            {range.label}
          </Button>
        ))}
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} tickMargin={8} minTickGap={40} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="subscribers" name="New Subscribers" stroke="#111" fill="#111" fillOpacity={0.08} />
            <Area type="monotone" dataKey="sent" name="Sent" stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} />
            <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#16a34a" fill="#16a34a" fillOpacity={0.08} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
