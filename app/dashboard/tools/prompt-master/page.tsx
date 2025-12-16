"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { RealEstatePhotoTools } from "@/components/prompt-master/real-estate-photo-tools"

export default function PromptMasterToolPage() {
  return (
    <>
      <DashboardHeader
        title="AI Photo Tools"
        description="Generate precise prompts for listing photo edits: declutter, remove personal items, twilight, sky replacement, and virtual staging."
      />

      <div className="p-6 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <RealEstatePhotoTools />
      </div>
    </>
  )
}
