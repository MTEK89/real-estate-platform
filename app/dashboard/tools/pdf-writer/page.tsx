"use client"

import Link from "next/link"
import { ArrowLeft, PenLine } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PdfWriterTool } from "@/components/tools/pdf-writer/pdf-writer"

export default function PdfWriterToolPage() {
  return (
    <>
      <DashboardHeader
        title="PDF Writer"
        description="Paste plain text and generate a Mandate-styled PDF, saved to Supabase."
      />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <PenLine className="h-4 w-4" />
            Mandate-style PDF
          </div>
        </div>

        <PdfWriterTool />
      </div>
    </>
  )
}

