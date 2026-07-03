"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";

interface Props {
  data: { name: string; value: number }[];
  height?: number;
  currency?: boolean;
}

export function SimpleBarChart({ data, height = 300, currency = true }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(240 5% 60%)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(240 5% 60%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => (currency ? formatCurrencyCompact(Number(v)) : String(v))}
        />
        <Tooltip
          cursor={{ fill: "hsl(240 6% 16%)" }}
          contentStyle={{
            background: "hsl(240 9% 11%)",
            border: "1px solid hsl(240 6% 20%)",
            borderRadius: 8,
            color: "hsl(0 0% 98%)",
          }}
          formatter={(v) => [currency ? formatCurrency(Number(v)) : String(v), currency ? "Revenue" : "Count"]}
        />
        <Bar dataKey="value" fill="hsl(158 64% 45%)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
