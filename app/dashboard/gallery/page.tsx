"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { SupabaseGalleryPage } from "@/components/gallery/supabase-gallery-page"

export default function GalleryRoutePage() {
  return (
    <>
      <DashboardHeader title="Gallery" description="A simple photo library to organize listing media by property." />
      <div className="space-y-6 p-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <SupabaseGalleryPage />
      </div>
    </>
  )
}
