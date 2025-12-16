export type WatermarkPosition =
  | "top_left"
  | "top_center"
  | "top_right"
  | "middle_left"
  | "middle_center"
  | "middle_right"
  | "bottom_left"
  | "bottom_center"
  | "bottom_right"

export type WatermarkMode = "logo" | "text" | "both"

export type WatermarkOptions = {
  mode: WatermarkMode
  position: WatermarkPosition
  paddingPx: number
  opacity: number // 0..1
  rotationDeg: number // -45..45 typical
  scalePct: number // 1..200 (logo scale relative)
  text: string
  textSizePx: number
  textColor: string // hex
  tile: boolean
  tileGapPct: number // % of shortest edge
  maxLongEdgePx: number | null // resize output; null keeps original
  outputFormat: "image/jpeg" | "image/png" | "image/webp"
  jpegQuality: number // 0..1
}

export async function loadImageBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const res = await fetch(url)
  const blob = await res.blob()
  return await createImageBitmap(blob)
}

export function computeFitSize(width: number, height: number, maxLongEdgePx: number | null) {
  if (!maxLongEdgePx || maxLongEdgePx <= 0) return { width, height, scale: 1 }
  const longEdge = Math.max(width, height)
  if (longEdge <= maxLongEdgePx) return { width, height, scale: 1 }
  const scale = maxLongEdgePx / longEdge
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale }
}

function positionToXY(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  boxW: number,
  boxH: number,
  padding: number,
) {
  const left = padding
  const right = canvasW - padding - boxW
  const top = padding
  const bottom = canvasH - padding - boxH
  const centerX = Math.round((canvasW - boxW) / 2)
  const centerY = Math.round((canvasH - boxH) / 2)

  switch (position) {
    case "top_left":
      return { x: left, y: top }
    case "top_center":
      return { x: centerX, y: top }
    case "top_right":
      return { x: right, y: top }
    case "middle_left":
      return { x: left, y: centerY }
    case "middle_center":
      return { x: centerX, y: centerY }
    case "middle_right":
      return { x: right, y: centerY }
    case "bottom_left":
      return { x: left, y: bottom }
    case "bottom_center":
      return { x: centerX, y: bottom }
    case "bottom_right":
      return { x: right, y: bottom }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

function getWatermarkFont(fontSizePx: number, weight: number) {
  const size = clamp(fontSizePx, 8, 220)
  const w = clamp(weight, 400, 900)
  return `${w} ${size}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial`
}

function parseHexColor(hex: string) {
  const normalized = hex.trim().replace("#", "")
  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0] + normalized[0], 16)
    const g = Number.parseInt(normalized[1] + normalized[1], 16)
    const b = Number.parseInt(normalized[2] + normalized[2], 16)
    return { r, g, b }
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return { r, g, b }
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = parseHexColor(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`
}

function buildTextLines(text: string) {
  return text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean)
}

function ensureCanvas(width: number, height: number) {
  const hasOffscreen = typeof OffscreenCanvas !== "undefined"
  const canvas: OffscreenCanvas | HTMLCanvasElement = hasOffscreen
    ? new OffscreenCanvas(width, height)
    : (() => {
        const c = document.createElement("canvas")
        c.width = width
        c.height = height
        return c
      })()
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not available")
  return { canvas, ctx, hasOffscreen }
}

function measureTextBlock(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  lines: string[],
  fontSizePx: number,
) {
  const font = getWatermarkFont(fontSizePx, 700)
  ctx.font = font
  const lineHeight = Math.round(clamp(fontSizePx, 8, 220) * 1.25)
  let maxWidth = 0
  for (const line of lines) {
    maxWidth = Math.max(maxWidth, ctx.measureText(line).width)
  }
  return { width: Math.ceil(maxWidth), height: lineHeight * lines.length, lineHeight, font }
}

function renderWatermarkOverlay(input: {
  options: WatermarkOptions
  logo?: ImageBitmap | null
  canvasWidth: number
  canvasHeight: number
}) {
  const { options, logo, canvasWidth, canvasHeight } = input
  const shortest = Math.min(canvasWidth, canvasHeight)
  const textLines = options.text.trim() ? buildTextLines(options.text) : []

  // Interpret scalePct as "logo width = % of shortest edge"
  const logoTargetWidth = (clamp(options.scalePct, 1, 200) / 100) * shortest
  const logoScale = logo ? logoTargetWidth / logo.width : 1

  const logoW = logo ? Math.max(1, Math.round(logo.width * logoScale)) : 0
  const logoH = logo ? Math.max(1, Math.round(logo.height * logoScale)) : 0

  // Measure text
  const measurer = ensureCanvas(1, 1)
  const textBlock =
    options.mode === "text" || options.mode === "both"
      ? measureTextBlock(measurer.ctx, textLines, options.textSizePx)
      : { width: 0, height: 0, lineHeight: 0, font: getWatermarkFont(options.textSizePx, 700) }

  const gap = options.mode === "both" && logo ? Math.round(clamp(options.textSizePx, 8, 220) * 0.6) : 0

  const overlayW =
    options.mode === "logo"
      ? logoW
      : options.mode === "text"
        ? textBlock.width
        : Math.round(logoW + gap + textBlock.width)

  const overlayH =
    options.mode === "logo"
      ? logoH
      : options.mode === "text"
        ? textBlock.height
        : Math.max(logoH, textBlock.height)

  const width = Math.max(1, Math.ceil(overlayW))
  const height = Math.max(1, Math.ceil(overlayH))

  const { canvas, ctx, hasOffscreen } = ensureCanvas(width, height)

  // Draw logo + text into overlay (no opacity here; base draw will handle global alpha)
  if ((options.mode === "logo" || options.mode === "both") && logo) {
    ctx.drawImage(logo, 0, 0, logoW, logoH)
  }

  if ((options.mode === "text" || options.mode === "both") && textLines.length) {
    ctx.font = textBlock.font
    ctx.fillStyle = rgba(options.textColor, 1)
    ctx.textBaseline = "top"

    const startX = options.mode === "both" && logo ? logoW + gap : 0
    const startY =
      options.mode === "both" && logo
        ? Math.max(0, Math.round((height - textBlock.height) / 2))
        : 0

    let yy = startY
    for (const line of textLines) {
      ctx.fillText(line, startX, yy)
      yy += textBlock.lineHeight
    }
  }

  return { canvas, ctx, hasOffscreen, width, height }
}

export async function applyWatermarkToImage(input: {
  image: ImageBitmap
  logo?: ImageBitmap | null
  options: WatermarkOptions
}): Promise<Blob> {
  const { image, logo, options } = input

  const fit = computeFitSize(image.width, image.height, options.maxLongEdgePx)
  const { canvas, ctx, hasOffscreen } = ensureCanvas(fit.width, fit.height)

  ctx.drawImage(image, 0, 0, fit.width, fit.height)

  const overlay = renderWatermarkOverlay({
    options,
    logo,
    canvasWidth: fit.width,
    canvasHeight: fit.height,
  })

  const rotation = (options.rotationDeg * Math.PI) / 180
  ctx.save()
  ctx.globalAlpha = clamp(options.opacity, 0, 1)

  const shortest = Math.min(fit.width, fit.height)
  const gap = (clamp(options.tileGapPct, 1, 200) / 100) * shortest
  const stepX = overlay.width + gap
  const stepY = overlay.height + gap

  const drawOverlayAt = (x: number, y: number) => {
    ctx.save()
    const cx = x + overlay.width / 2
    const cy = y + overlay.height / 2
    ctx.translate(cx, cy)
    if (rotation) ctx.rotate(rotation)
    ctx.translate(-overlay.width / 2, -overlay.height / 2)
    ctx.drawImage(overlay.canvas as any, 0, 0)
    ctx.restore()
  }

  if (options.tile) {
    for (let y = -stepY; y < fit.height + stepY; y += stepY) {
      for (let x = -stepX; x < fit.width + stepX; x += stepX) {
        drawOverlayAt(x, y)
      }
    }
  } else {
    const { x, y } = positionToXY(options.position, fit.width, fit.height, overlay.width, overlay.height, options.paddingPx)
    drawOverlayAt(x, y)
  }
  ctx.restore()

  const mime = options.outputFormat
  const quality = mime === "image/jpeg" ? clamp(options.jpegQuality, 0.1, 1) : undefined
  if (hasOffscreen) {
    const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality })
    return blob
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob(
      (b) => {
        if (!b) reject(new Error("Failed to export image"))
        else resolve(b)
      },
      mime,
      quality,
    )
  })
  return blob
}
