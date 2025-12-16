"use client"

import { useState } from "react"
import { Plus, Download, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { FinanceStats } from "@/components/finance-stats"
import { CommissionsTable } from "@/components/commissions-table"
import { InvoicesTable } from "@/components/invoices-table"

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview")

  const handleExportReport = () => {
    // Generate finance report
    const report = `
FINANCE REPORT
==============
Generated: ${new Date().toLocaleDateString("fr-FR")}

This report contains a summary of your financial data.
For detailed analysis, please use the export features in each section.

---
PropFlow Realty
    `.trim()

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-report-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <DashboardHeader
        title="Finance & Commissions"
        description="Track revenue, commissions, and manage invoices"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/finance/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <FinanceStats />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent Commissions</h3>
                <CommissionsTable />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent Invoices</h3>
                <InvoicesTable />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="mt-4">
            <CommissionsTable />
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <InvoicesTable />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
