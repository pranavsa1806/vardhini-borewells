"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(158 64% 45%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(158 64% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" vertical={false} />
        <XAxis dataKey="month" stroke="hsl(240 5% 60%)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(240 5% 60%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatCurrencyCompact(Number(v))}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(240 9% 11%)",
            border: "1px solid hsl(240 6% 20%)",
            borderRadius: 8,
            color: "hsl(0 0% 98%)",
          }}
          formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="hsl(158 64% 45%)" strokeWidth={2} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
