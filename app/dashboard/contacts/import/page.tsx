"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload } from "lucide-react"

export default function ContactsImportPage() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvText, setCsvText] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)

  const preview = useMemo(() => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "")
    return lines.slice(0, 6)
  }, [csvText])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    setCsvText(text)
  }

  const onImport = async () => {
    if (!csvText.trim()) return
    setIsImporting(true)
    try {
      const res = await fetch("/api/v1/contacts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: csvText }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Import failed")

      toast.success(`Imported ${data.imported ?? "contacts"} successfully`)
      // DataStore lives in layout; easiest is a full reload to refresh state.
      window.location.href = "/dashboard/contacts"
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed"
      toast.error(msg)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Import Contacts"
        description="Upload a CSV file to bulk-add contacts to your CRM"
        actions={
          <Link href="/dashboard/contacts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>
              Recommended columns: `firstName`, `lastName`, `email`, `phone`, `type`, `status`, `source`, `tags`, `notes`
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />

            {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}

            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
              <pre className="text-xs whitespace-pre-wrap">{preview.length ? preview.join("\n") : "Upload a CSV to preview."}</pre>
            </div>

            <div className="flex justify-end">
              <Button onClick={onImport} disabled={!csvText.trim() || isImporting}>
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
