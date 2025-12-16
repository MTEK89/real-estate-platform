"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ContractsTable } from "@/components/contracts-table"
import { OperationalDocumentsTable } from "@/components/operational-documents-table"
import { DocumentsStats } from "@/components/documents-stats"
import { PropertyValuationTool } from "@/components/property-valuation-tool"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/data-store"
import { Plus, Search, FileText, ClipboardCheck, Calculator } from "lucide-react"
import Link from "next/link"

export default function ContractsPage() {
  const { contracts, operationalDocuments } = useDataStore()
  const [activeTab, setActiveTab] = useState("contracts")
  const [operationalTypeFilter, setOperationalTypeFilter] = useState("all")
  const [operationalStatusFilter, setOperationalStatusFilter] = useState("all")
  const [operationalSearch, setOperationalSearch] = useState("")

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Documents & Contracts"
        description="Manage legal documents and operational files (marketing lives in Marketing)."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/dashboard/marketing/documents/new">Marketing Documents</Link>
            </Button>
            <Link href="/dashboard/contracts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <DocumentsStats />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contracts ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Documents ({operationalDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="valuation" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Valuation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {/* Contracts Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search contracts..." className="pl-9" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Contract Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mandate">Mandate</SelectItem>
                  <SelectItem value="sale_existing">Sale (Existing)</SelectItem>
                  <SelectItem value="sale_vefa">Sale (VEFA)</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Property Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_signature">Pending</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ContractsTable />
          </TabsContent>

          <TabsContent value="operational" className="space-y-4">
            {/* Operational Documents Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9"
                  value={operationalSearch}
                  onChange={(e) => setOperationalSearch(e.target.value)}
                />
              </div>
              <Select value={operationalTypeFilter} onValueChange={setOperationalTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="etat_des_lieux">État des Lieux</SelectItem>
                  <SelectItem value="remise_des_cles">Remise des Clés</SelectItem>
                  <SelectItem value="photo_session">Photo Session</SelectItem>
                  <SelectItem value="surface_calculation">Surface Calculation</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={operationalStatusFilter} onValueChange={setOperationalStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <OperationalDocumentsTable
              typeFilter={operationalTypeFilter}
              statusFilter={operationalStatusFilter}
              searchQuery={operationalSearch}
            />
          </TabsContent>

          <TabsContent value="valuation" className="space-y-4">
            <PropertyValuationTool />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
