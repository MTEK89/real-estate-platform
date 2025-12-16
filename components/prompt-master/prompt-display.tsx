"use client"

import { toast } from "sonner"
import { Clipboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PromptDisplayProps {
  prompt: string
}

export function PromptDisplay({ prompt }: PromptDisplayProps) {
  const handleCopy = async () => {
    if (!prompt) {
      toast.error("Nothing to copy!")
      return
    }

    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied to clipboard!")
    } catch {
      toast.error("Copy failed.")
    }
  }

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Generated Prompt</CardTitle>
        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleCopy}>
          <Clipboard className="h-4 w-4" />
          <span className="sr-only">Copy</span>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] w-full rounded-md border bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap text-sm">
            <code>{prompt || "Your generated prompt will appear here..."}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

