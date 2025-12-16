"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { name: "Website", value: 35, color: "hsl(var(--primary))" },
  { name: "Referrals", value: 25, color: "hsl(45, 80%, 50%)" },
  { name: "atHome.lu", value: 20, color: "hsl(210, 60%, 50%)" },
  { name: "Open House", value: 12, color: "hsl(280, 60%, 50%)" },
  { name: "Other", value: 8, color: "hsl(var(--muted-foreground))" },
]

export function LeadSourcesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Sources</CardTitle>
        <CardDescription>Where your leads come from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, "Share"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
