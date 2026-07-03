"use client";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/export";
import { Download } from "lucide-react";

interface Props {
  monthly: { month: string; revenue: number; jobs: number }[];
  byType: { name: string; revenue: number; jobs: number }[];
  totals: { totalBilled: number; totalCollected: number; outstanding: number; jobCount: number; avgDepth: number };
}

export function ReportsExport({ monthly, byType, totals }: Props) {
  function exportAll() {
    const rows = [
      { section: "Summary", label: "Total Billed", value: totals.totalBilled },
      { section: "Summary", label: "Total Collected", value: totals.totalCollected },
      { section: "Summary", label: "Outstanding", value: totals.outstanding },
      { section: "Summary", label: "Total Jobs", value: totals.jobCount },
      { section: "Summary", label: "Avg Depth (ft)", value: totals.avgDepth },
      ...monthly.map((m) => ({ section: "Monthly", label: m.month, value: m.revenue, jobs: m.jobs })),
      ...byType.map((t) => ({ section: "By Type", label: t.name, value: t.revenue, jobs: t.jobs })),
    ];
    exportToCsv("borewell-report.csv", rows as unknown as Record<string, unknown>[]);
  }

  return (
    <Button variant="outline" onClick={exportAll}>
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
