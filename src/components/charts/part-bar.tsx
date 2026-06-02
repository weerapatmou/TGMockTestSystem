"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type PartBarDatum = { name: string; group: number; me: number | null };

export function PartBar({ data }: { data: PartBarDatum[] }) {
  const height = Math.max(220, data.length * 34 + 60);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-border)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "var(--color-faint)", fontSize: 11 }}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "var(--color-surface-2)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-foreground)",
          }}
          formatter={(value) => `${Number(value).toFixed(1)}%`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          content={() => (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, color: "var(--color-muted)" }}>
              {[
                { color: "var(--color-faint)", label: "กลุ่ม (เฉลี่ย)" },
                { color: "var(--color-good)", label: "ฉัน ≥ กลุ่ม" },
                { color: "var(--color-bad)", label: "ฉัน < กลุ่ม" },
              ].map(({ color, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: color }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        />
        <Bar
          name="กลุ่ม (เฉลี่ย)"
          dataKey="group"
          fill="var(--color-faint)"
          radius={[0, 4, 4, 0]}
          barSize={12}
        />
        <Bar
          name="ฉัน"
          dataKey="me"
          radius={[0, 4, 4, 0]}
          barSize={12}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.me === null
                  ? "var(--color-faint)"
                  : d.me >= d.group
                  ? "var(--color-good)"
                  : "var(--color-bad)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
