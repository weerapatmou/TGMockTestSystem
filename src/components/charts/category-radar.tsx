"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export type RadarDatum = { category: string; me: number; group: number };

export function CategoryRadar({
  data,
  showMe = true,
  showGroup = true,
}: {
  data: RadarDatum[];
  showMe?: boolean;
  showGroup?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-faint)", fontSize: 10 }}
          stroke="var(--color-border)"
        />
        {showGroup && (
          <Radar
            name="กลุ่ม (เฉลี่ย)"
            dataKey="group"
            stroke="var(--color-faint)"
            fill="var(--color-faint)"
            fillOpacity={0.15}
          />
        )}
        {showMe && (
          <Radar
            name="ฉัน"
            dataKey="me"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.35}
          />
        )}
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-foreground)",
          }}
          formatter={(value) => `${Number(value).toFixed(1)}%`}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
