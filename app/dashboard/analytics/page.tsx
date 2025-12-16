"use client"

import { Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { RevenueChart } from "@/components/revenue-chart"
import { PipelineChart } from "@/components/pipeline-chart"
import { ActivityChart } from "@/components/activity-chart"
import { LeadSourcesChart } from "@/components/lead-sources-chart"
import { AgentLeaderboard } from "@/components/agent-leaderboard"

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader
        title="Analytics & Reports"
        description="Track performance and gain insights"
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="quarter">
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <AnalyticsOverview />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <PipelineChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
          <LeadSourcesChart />
        </div>

        <AgentLeaderboard />
      </div>
    </>
  )
}
