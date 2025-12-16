"use client"

import { useState, useCallback } from "react"
import type { DocumentType, BrandConfig } from "@/lib/pdf"

interface UsePdfGenerationOptions {
  brandConfig?: Partial<BrandConfig>
}

interface GeneratePdfOptions {
  documentType: DocumentType
  data: Record<string, unknown>
  filename?: string
}

export function usePdfGeneration(options: UsePdfGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePdf = useCallback(
    async ({ documentType, data, filename }: GeneratePdfOptions) => {
      setIsGenerating(true)
      setError(null)

      try {
        const response = await fetch("/api/pdf/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType,
            data,
            brandConfig: options.brandConfig,
            options: { filename },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate PDF")
        }

        const blob = await response.blob()
        return blob
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        throw err
      } finally {
        setIsGenerating(false)
      }
    },
    [options.brandConfig]
  )

  const downloadPdf = useCallback(
    async ({ documentType, data, filename }: GeneratePdfOptions) => {
      try {
        const blob = await generatePdf({ documentType, data, filename })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename || `${documentType}_${Date.now()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return true
      } catch {
        return false
      }
    },
    [generatePdf]
  )

  const previewPdf = useCallback(
    async ({ documentType, data, filename }: GeneratePdfOptions) => {
      try {
        // Open a tab synchronously to avoid popup blockers (must happen before awaiting).
        const previewWindow = window.open("about:blank", "_blank")

        const blob = await generatePdf({ documentType, data, filename })

        const url = window.URL.createObjectURL(blob)
        if (previewWindow) {
          previewWindow.location.href = url
        } else {
          // Fallback (popup blocked): try to open after-the-fact anyway.
          window.open(url, "_blank")
        }

        // Clean up after a delay (user has time to view)
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 60000)

        return true
      } catch (err) {
        console.error("PDF preview failed:", err)
        return false
      }
    },
    [generatePdf]
  )

  return {
    generatePdf,
    downloadPdf,
    previewPdf,
    isGenerating,
    error,
  }
}
