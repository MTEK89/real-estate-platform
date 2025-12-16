"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { PipelineBoard } from "@/components/pipeline-board"
import { PipelineStats } from "@/components/pipeline-stats"
import { DealsTable } from "@/components/deals-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deals } from "@/lib/mock-data"
import { Plus, Kanban, List, Home, Key } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function PipelinePage() {
  const [pipelineType, setPipelineType] = useState<"sale" | "rental">("sale")

  const filteredDeals = deals.filter((d) => d.type === pipelineType)
  const activeDeals = filteredDeals.filter((d) => d.status !== "closed").length

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Pipeline"
        description={`${activeDeals} active ${pipelineType === "sale" ? "sales" : "rentals"} in your pipeline`}
        actions={
          <Link href="/dashboard/pipeline/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Tabs value={pipelineType} onValueChange={(v) => setPipelineType(v as "sale" | "rental")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sale" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Sales Pipeline
            </TabsTrigger>
            <TabsTrigger value="rental" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Rentals Pipeline
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <PipelineStats pipelineType={pipelineType} />

        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            <PipelineBoard pipelineType={pipelineType} />
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <DealsTable pipelineType={pipelineType} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
