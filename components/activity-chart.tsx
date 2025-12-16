"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { week: "W1", visits: 12, calls: 28, emails: 45 },
  { week: "W2", visits: 15, calls: 32, emails: 52 },
  { week: "W3", visits: 8, calls: 24, emails: 38 },
  { week: "W4", visits: 18, calls: 35, emails: 48 },
]

export function ActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Trends</CardTitle>
        <CardDescription>Weekly activity breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-xs" />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="visits"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="hsl(45, 80%, 50%)"
                strokeWidth={2}
                dot={{ fill: "hsl(45, 80%, 50%)" }}
              />
              <Line
                type="monotone"
                dataKey="emails"
                stroke="hsl(280, 60%, 50%)"
                strokeWidth={2}
                dot={{ fill: "hsl(280, 60%, 50%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
