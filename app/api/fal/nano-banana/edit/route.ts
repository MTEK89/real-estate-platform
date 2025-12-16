import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

type FalImageOutput = {
  url: string
  content_type?: string
  file_name?: string
  file_size?: number
  width?: number
  height?: number
}

type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED"

const DEFAULT_MODEL_ID = process.env.FAL_NANO_BANANA_MODEL_ID || "fal-ai/gemini-25-flash-image"
const DEFAULT_MODEL_SUBPATH = process.env.FAL_NANO_BANANA_SUBPATH || "edit"
const DEFAULT_MODEL = `${DEFAULT_MODEL_ID}/${DEFAULT_MODEL_SUBPATH}`

// Allowlist supported models so the API can't be abused to call arbitrary Fal models.
const SUPPORTED_MODELS = [
  "fal-ai/gemini-25-flash-image/edit",
  "fal-ai/nano-banana-pro/edit",
  "fal-ai/bytedance/seedream/v4.5/edit",
]

function resolveModel(inputModel: unknown) {
  const model = typeof inputModel === "string" && inputModel.trim() ? inputModel.trim() : DEFAULT_MODEL
  if (!SUPPORTED_MODELS.includes(model)) {
    return { ok: false as const, error: `Unsupported model. Allowed: ${SUPPORTED_MODELS.join(", ")}` }
  }
  return { ok: true as const, model }
}

function getFalKey() {
  return process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.FAL_TOKEN
}

function ensureFalConfigured() {
  const key = getFalKey()
  if (!key) return null
  fal.config({ credentials: key })
  return key
}

function toNumImages(input: unknown) {
  const raw = typeof input === "number" ? input : Number(input)
  const safe = Number.isFinite(raw) ? raw : 1
  return Math.min(Math.max(Math.floor(safe), 1), 4)
}

export async function POST(req: NextRequest) {
  try {
    if (!ensureFalConfigured()) {
      return NextResponse.json(
        { error: "FAL key not configured. Set FAL_KEY (or FAL_API_KEY) in your environment." },
        { status: 500 },
      )
    }

    const body = (await req.json().catch(() => null)) as
      | {
          model?: string
          prompt?: string
          image_url?: string
          image_urls?: string[]
          num_images?: number
          output_format?: "png" | "jpeg" | "webp"
          sync_mode?: boolean
        }
      | null

    const resolved = resolveModel(body?.model)
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 })

    const prompt = body?.prompt?.trim()
    const imageUrls = body?.image_urls?.length ? body.image_urls : body?.image_url ? [body.image_url] : []
    const numImages = toNumImages(body?.num_images)
    const outputFormat = body?.output_format || "png"

    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 })
    if (!imageUrls.length) return NextResponse.json({ error: "image_url (or image_urls) is required" }, { status: 400 })

    // Queue submission (async). Client polls via GET with requestId.
    const submit = await fal.queue.submit(resolved.model, {
      input: {
        prompt,
        image_urls: imageUrls,
        num_images: numImages,
        output_format: outputFormat,
        sync_mode: false,
      },
    })

    return NextResponse.json({ requestId: submit.request_id, model: resolved.model })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!ensureFalConfigured()) {
      return NextResponse.json(
        { error: "FAL key not configured. Set FAL_KEY (or FAL_API_KEY) in your environment." },
        { status: 500 },
      )
    }

    const requestId = req.nextUrl.searchParams.get("requestId")?.trim()
    if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 })

    const modelParam = req.nextUrl.searchParams.get("model")
    const resolved = resolveModel(modelParam)
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 })

    const status = await fal.queue.status(resolved.model, { requestId, logs: false })
    const state = status.status as QueueStatus

    if (state !== "COMPLETED") {
      return NextResponse.json({
        requestId,
        model: resolved.model,
        status: state,
        queue_position: status.queue_position ?? null,
      })
    }

    const result = await fal.queue.result(resolved.model, { requestId })
    const data = result.data as { images?: FalImageOutput[]; image?: FalImageOutput } | null
    const images = data?.images?.length ? data.images : data?.image ? [data.image] : []

    return NextResponse.json({ requestId, model: resolved.model, status: state, images })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
