"use client"

import { useMemo, useState } from "react"
import { Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ImageResult({
  originalUrl,
  images,
  selectedIndex,
  isLoading,
  prompt,
  onSelectImage,
  onRegenerate,
  onSaveToGallery,
  showComparison = true,
}: {
  originalUrl: string | null
  images: Array<{ url: string }>
  selectedIndex: number
  isLoading: boolean
  // Kept for backward compatibility; intentionally not rendered in the UI.
  prompt: string
  onSelectImage: (index: number) => void
  onRegenerate?: () => void
  onSaveToGallery?: (url: string) => void
  showComparison?: boolean
}) {
  const selected = images[selectedIndex]?.url || null
  const title = useMemo(() => (isLoading ? "Generating…" : selected ? "Result" : "Result"), [isLoading, selected])
  const [revealPct, setRevealPct] = useState(50)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const maybeSetAspectFromImg = (img: HTMLImageElement) => {
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return
    const r = w / h
    if (!Number.isFinite(r) || r <= 0) return
    setAspectRatio((prev) => prev ?? r)
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {onRegenerate ? (
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          ) : null}
          {selected && onSaveToGallery ? (
            <Button variant="outline" size="sm" onClick={() => onSaveToGallery(selected)} disabled={isLoading}>
              Save to Gallery
            </Button>
          ) : null}
          {selected ? (
            <Button asChild variant="outline" size="sm">
              <a href={selected} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-md border bg-muted/30">
            {selected ? (
              originalUrl && showComparison ? (
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: aspectRatio ?? 1,
                  }}
                >
                  {/* Blurred background to hide letterboxing gaps when original/generated aspect ratios differ */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
                    onLoad={(e) => maybeSetAspectFromImg(e.currentTarget)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-contain"
                    onLoad={(e) => maybeSetAspectFromImg(e.currentTarget)}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected}
                      alt="Generated"
                      className="absolute inset-0 h-full w-full object-contain"
                      onLoad={(e) => maybeSetAspectFromImg(e.currentTarget)}
                    />
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: aspectRatio ?? 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
                    onLoad={(e) => maybeSetAspectFromImg(e.currentTarget)}
                  />
                  <img
                    src={selected}
                    alt="Generated"
                    className="absolute inset-0 h-full w-full object-contain"
                    onLoad={(e) => maybeSetAspectFromImg(e.currentTarget)}
                  />
                </div>
              )
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-8 text-sm text-muted-foreground">
                {isLoading ? "Generating image…" : "Your generated image will appear here."}
              </div>
            )}
          </div>

          {originalUrl && selected && showComparison ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Before</span>
                <span>After</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={revealPct}
                onChange={(e) => setRevealPct(Number(e.target.value))}
                className="w-full"
                aria-label="Before/After slider"
              />
            </div>
          ) : null}

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => onSelectImage(idx)}
                  className={[
                    "overflow-hidden rounded-md border bg-muted/30",
                    idx === selectedIndex ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Variant ${idx + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
