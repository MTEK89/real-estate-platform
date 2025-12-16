"use client"

import Link from "next/link"
import { ArrowLeft, Camera } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AiHeadshotPhotographer } from "@/components/tools/headshot/ai-headshot-photographer"

export default function AiHeadshotToolPage() {
  return (
    <>
      <DashboardHeader
        title="AI Headshot Photographer"
        description="Generate a professional agent headshot and swap outfits—fast, simple, and consistent."
      />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            Nano Banana via fal.ai
          </div>
        </div>

        <AiHeadshotPhotographer />
      </div>
    </>
  )
}

