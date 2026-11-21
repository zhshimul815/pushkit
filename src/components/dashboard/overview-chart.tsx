"use client";

import dynamic from "next/dynamic";
import type { Point } from "./overview-chart-inner";

const OverviewChartInner = dynamic(
  () => import("./overview-chart-inner").then((mod) => mod.OverviewChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] w-full items-center justify-center text-sm text-muted-foreground">
        Loading chart...
      </div>
    ),
  }
);

export function OverviewChart({ series }: { series: Point[] }) {
  return <OverviewChartInner series={series} />;
}
