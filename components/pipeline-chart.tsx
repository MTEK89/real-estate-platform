"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { stage: "Lead", count: 15, value: 2250000 },
  { stage: "Visit", count: 8, value: 1440000 },
  { stage: "Offer", count: 5, value: 1125000 },
  { stage: "Negotiation", count: 3, value: 810000 },
  { stage: "Contract", count: 2, value: 540000 },
  { stage: "Notary", count: 1, value: 285000 },
  { stage: "Closed", count: 1, value: 315000 },
]

const colors = [
  "hsl(var(--muted-foreground))",
  "hsl(210, 60%, 50%)",
  "hsl(190, 60%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(30, 80%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(var(--primary))",
]

export function PipelineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline by Stage</CardTitle>
        <CardDescription>Deal count and value per stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-xs" />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                className="text-xs"
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "count") return [value, "Deals"]
                  return [`€${value.toLocaleString("de-DE")}`, "Value"]
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
