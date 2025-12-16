"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight } from "lucide-react"

const steps = [
  {
    title: "Create your first property",
    description: "Add address, characteristics, and pricing.",
    href: "/dashboard/properties/new",
  },
  {
    title: "Upload photos to the Gallery",
    description: "Drag & drop, then link photos to the property.",
    href: "/dashboard/gallery",
  },
  {
    title: "Add contacts",
    description: "Create sellers/buyers or import from CSV.",
    href: "/dashboard/contacts",
  },
  {
    title: "Generate your first contract",
    description: "Use the Mandate flow to create a PDF.",
    href: "/dashboard/contracts/new",
  },
  {
    title: "Publish marketing",
    description: "Create a campaign and track performance.",
    href: "/dashboard/marketing",
  },
]

export default function OnboardingPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Onboarding"
        description="A quick checklist to get your agency ready for real work"
        actions={
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Most agencies finish this in 10–15 minutes for a first demo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((s) => (
              <div key={s.href} className="flex items-start justify-between gap-4 rounded-lg border bg-muted/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </div>
                <Link href={s.href}>
                  <Button size="sm">
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

