"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { WatermarkTool } from "@/components/tools/watermark/watermark-tool"

export default function WatermarkToolPage() {
  return (
    <>
      <DashboardHeader
        title="Watermark Photos"
        description="Add your logo and/or text watermark to any photos—runs locally without AI."
      />

      <div className="space-y-6 p-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <WatermarkTool />
      </div>
    </>
  )
}

