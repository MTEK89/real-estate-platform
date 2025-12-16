import { NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const REQUIRED_TABLES = ["agencies", "users", "agency_users", "contacts", "properties", "tasks", "audit_logs"] as const

function isMissingTableError(message: string) {
  return message.includes("Could not find the table")
}

function getFalStatus() {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.FAL_TOKEN
  const modelId = process.env.FAL_NANO_BANANA_MODEL_ID || "fal-ai/gemini-25-flash-image"
  const subpath = process.env.FAL_NANO_BANANA_SUBPATH || "edit"
  const defaultModel = `${modelId}/${subpath}`
  return {
    configured: Boolean(key && key.trim().length > 0),
    model: defaultModel,
    supportedModels: [
      "fal-ai/gemini-25-flash-image/edit",
      "fal-ai/nano-banana-pro/edit",
      "fal-ai/bytedance/seedream/v4.5/edit",
    ],
  }
}

export async function GET() {
  try {
    const supabase = isSupabaseAdminConfigured() ? getSupabaseAdmin() : getSupabaseServerClient()

    const missing: string[] = []

    for (const table of REQUIRED_TABLES) {
      // eslint-disable-next-line no-await-in-loop
      const { error } = await supabase.from(table).select("*").limit(1)
      if (error && isMissingTableError(error.message)) missing.push(table)
    }

    return NextResponse.json({
      ok: missing.length === 0,
      missing,
      adminConfigured: isSupabaseAdminConfigured(),
      fal: getFalStatus(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Setup check failed"
    return NextResponse.json(
      { ok: false, error: msg, missing: REQUIRED_TABLES, adminConfigured: isSupabaseAdminConfigured(), fal: getFalStatus() },
      { status: 500 },
    )
  }
}
