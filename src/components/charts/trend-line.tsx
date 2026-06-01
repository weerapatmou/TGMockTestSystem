"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type TrendDatum = { label: string; combined: number; scorePct: number };

export function TrendLine({ data }: { data: TrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-faint)", fontSize: 11 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-faint)", fontSize: 11 }}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-foreground)",
          }}
          formatter={(value) => Number(value).toFixed(1)}
        />
        <Line
          name="Combined"
          type="monotone"
          dataKey="combined"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-accent)" }}
        />
        <Line
          name="Score%"
          type="monotone"
          dataKey="scorePct"
          stroke="var(--color-gold)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
