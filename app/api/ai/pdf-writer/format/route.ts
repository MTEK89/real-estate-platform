import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const BodySchema = z.object({
  text: z.string().min(1),
  language: z.string().optional(),
  mode: z.enum(["strict", "format", "rewrite"]).optional().default("rewrite"),
  images: z
    .array(
      z.object({
        key: z.string().min(1),
        caption: z.string().optional(),
        filename: z.string().optional(),
      }),
    )
    .optional(),
})

function fallbackFormat(text: string) {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  return {
    title: "Document",
    reference: null as string | null,
    body: cleaned,
    layout: null as any,
  }
}

function normalizeForCompare(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove markdown-lite structural tokens
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*---\s*$/gm, "")
    .replace(/^!\[.*?]\(.*?\)\s*$/gm, "")
    // Remove punctuation-ish noise
    .replace(/[“”"'.:,;!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function similarityRatio(a: string, b: string) {
  const aa = normalizeForCompare(a)
  const bb = normalizeForCompare(b)
  if (!aa || !bb) return 0

  const aTokens = aa.split(" ")
  const bTokens = bb.split(" ")

  const counts = new Map<string, number>()
  for (const t of aTokens) counts.set(t, (counts.get(t) || 0) + 1)

  let overlap = 0
  for (const t of bTokens) {
    const c = counts.get(t) || 0
    if (c > 0) {
      overlap++
      counts.set(t, c - 1)
    }
  }

  return overlap / Math.max(aTokens.length, bTokens.length)
}

function normalizeForContainment(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”"]/g, '"')
}

function isContained(haystack: string, needle: string) {
  const h = normalizeForContainment(haystack)
  const n = normalizeForContainment(needle).trim()
  if (!n) return false
  return h.includes(n)
}

function sanitizeLayoutAgainstInput(layout: any, inputText: string, allowedImageKeys: Set<string>) {
  if (!layout || typeof layout !== "object") return null
  const out: any = {}

  if (typeof layout.summary === "string" && isContained(inputText, layout.summary)) {
    out.summary = layout.summary.trim()
  }

  if (Array.isArray(layout.keyPoints)) {
    const pts = layout.keyPoints.filter((p: any) => typeof p === "string" && isContained(inputText, p)).map((p: string) => p.trim())
    if (pts.length) out.keyPoints = pts.slice(0, 10)
  }

  if (Array.isArray(layout.keyFacts)) {
    const facts = layout.keyFacts
      .filter((f: any) => f && typeof f.label === "string" && typeof f.value === "string" && isContained(inputText, f.value))
      .map((f: any) => ({ label: f.label.trim().slice(0, 60), value: f.value.trim().slice(0, 200) }))
    if (facts.length) out.keyFacts = facts.slice(0, 20)
  }

  if (Array.isArray(layout.sections)) {
    const sections = layout.sections
      .filter((s: any) => s && typeof s.title === "string")
      .map((s: any) => {
        const section: any = { title: s.title.trim().slice(0, 80) }
        if (typeof s.body === "string" && isContained(inputText, s.body)) section.body = s.body.trim()
        if (Array.isArray(s.bullets)) {
          const bullets = s.bullets.filter((b: any) => typeof b === "string" && isContained(inputText, b)).map((b: string) => b.trim())
          if (bullets.length) section.bullets = bullets.slice(0, 12)
        }
        if (Array.isArray(s.numbered)) {
          const numbered = s.numbered.filter((b: any) => typeof b === "string" && isContained(inputText, b)).map((b: string) => b.trim())
          if (numbered.length) section.numbered = numbered.slice(0, 12)
        }
        if (Array.isArray(s.imageUrls)) {
          const urls = s.imageUrls.filter((u: any) => typeof u === "string" && u.trim()).map((u: string) => u.trim())
          if (urls.length) section.imageUrls = urls.slice(0, 10)
        }
        if (Array.isArray(s.imageKeys)) {
          const keys = s.imageKeys
            .filter((k: any) => typeof k === "string")
            .map((k: string) => k.trim())
            .filter((k: string) => Boolean(k) && allowedImageKeys.has(k))
          if (keys.length) section.imageKeys = keys.slice(0, 10)
        }
        return section
      })
      .filter((s: any) => (s.body && s.body.length) || (Array.isArray(s.bullets) && s.bullets.length) || (Array.isArray(s.numbered) && s.numbered.length))
    if (sections.length) out.sections = sections.slice(0, 12)
  }

  return Object.keys(out).length ? out : null
}

async function formatWithOpenAI(args: { text: string; language?: string; mode: "strict" | "format" | "rewrite" }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      ...fallbackFormat(args.text),
      warning: "OPENAI_API_KEY not configured; generated without AI formatting.",
    }
  }

  const modeRules =
    args.mode === "strict"
      ? `
STRICT MODE (content must be preserved):
- Do NOT paraphrase, rewrite, or add new claims.
- Keep the original wording and sentences whenever possible.
- You MAY fix only: whitespace and line breaks without changing any words.
- Do NOT produce a "layout" (must be null).
`.trim()
      : args.mode === "format"
        ? `
FORMAT-ONLY MODE (no rewrite):
- Do NOT paraphrase or rewrite wording.
- Keep the "body" exactly the original text (you may normalize line breaks only).
- You MAY produce "layout" to make the PDF visually appealing, but every sentence/phrase in layout must be copied verbatim from the input (no paraphrase).
- Prefer extracting existing sentences as summary/keyPoints and grouping them into sections.
`.trim()
        : `
REWRITE MODE (allowed to improve clarity):
- You MAY rewrite for clarity and professionalism.
- Do NOT add new claims, prices, or facts not present in the input.
`.trim()

  const imagesList = (args as any)?.images as Array<{ key: string; caption?: string; filename?: string }> | undefined
  const imageContext = imagesList?.length
    ? `
IMAGES AVAILABLE (keys you can place in layout.sections[].imageKeys):
${imagesList.map((i) => `- key="${i.key}" caption="${i.caption ?? ""}" filename="${i.filename ?? ""}"`).join("\n")}

Placement rule:
- If mode is "format" or "rewrite", you may set layout.sections[].imageKeys to place images near the most relevant section.
- Use ONLY the provided keys. Do not invent new keys.
`.trim()
    : ""

  const systemPrompt = `
You turn pasted raw text into a clean, professional, print-ready real-estate document.

Output MUST be a JSON object with keys:
- "title": string (short professional title)
- "reference": string|null (optional reference if detected, else null)
- "body": string (formatted document using the restricted markup below)
- "layout": object|null (optional structured layout to make the PDF visually appealing)

If you can confidently extract structure, include "layout" with:
- summary: string|null (1–3 sentences)
- keyPoints: string[]|null (3–7 bullets)
- keyFacts: {label:string,value:string}[]|null (ONLY facts explicitly in input)
- sections: {title:string, body?:string|null, bullets?:string[]|null, numbered?:string[]|null, imageUrls?:string[]|null, imageKeys?:string[]|null}[]|null

Restricted markup (ONLY these):
- Headings: "# " (H1), "## " (H2), "### " (H3)
- Bullets: "- " items
- Numbered lists: "1. " items
- Horizontal rule: "---" (optional)
- Images: "![caption](url)" where url is an existing image URL from the user's text (do NOT invent URLs)
- Image anchors: "[[IMAGE:key]]" tokens already present in the input MUST be preserved exactly (do not delete or rename).

Rules:
- Preserve meaning; fix grammar, spacing, and typography.
- Keep language: ${args.language ? `"${args.language}"` : "same as input"}.
- Do NOT add legal claims, prices, or facts not present in the input.
- If the input is a letter/email, format it like a letter with clear sections.
- If you find an image URL in the input (jpg/jpeg/png), place it on its own line as an image block near the relevant section.
- If the input contains webp image URLs, keep the URL but add "(webp)" in the caption.
- If the input contains any "[[IMAGE:key]]" tokens, keep them as-is and you may move them near the most relevant section.

${imageContext}

${modeRules}

Return JSON only. No markdown fences. No extra keys.
`.trim()

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1800,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as any
  const content = data?.choices?.[0]?.message?.content
  const parsed = JSON.parse(content || "{}") as any
  const formatted = {
    title: typeof parsed?.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Document",
    reference: typeof parsed?.reference === "string" && parsed.reference.trim() ? parsed.reference.trim() : null,
    body: typeof parsed?.body === "string" ? String(parsed.body).trim() : String(args.text).trim(),
    layout: typeof parsed?.layout === "object" ? (parsed.layout as any) : null,
  }

  if (args.mode === "strict") {
    // Ensure the pasted content is preserved 1:1 (apart from line-ending normalization).
    // Also disable the structured layout to avoid AI-generated paraphrases in summaries/sections.
    formatted.body = String(args.text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    formatted.layout = null
  }

  if (args.mode === "format") {
    const original = String(args.text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    const ratio = similarityRatio(original, formatted.body)
    if (ratio < 0.98) {
      formatted.body = original
      ;(formatted as any).__warning = `Format-only: kept original text (similarity ${ratio.toFixed(2)}).`
    } else {
      formatted.body = original
    }
    const allowed = new Set((imagesList ?? []).map((i) => i.key).filter(Boolean))
    formatted.layout = sanitizeLayoutAgainstInput(parsed?.layout, original, allowed)
  }

  return formatted
}

export async function POST(req: NextRequest) {
  let rawText = ""
  try {
    const body = BodySchema.parse(await req.json())
    const text = body.text.trim()
    rawText = text
    if (!text) return NextResponse.json({ error: "Text is required." }, { status: 400 })

    const formatted = await formatWithOpenAI({ text, language: body.language, mode: body.mode, images: body.images } as any)
    const warning = (formatted as any).__warning
    if (typeof warning === "string" && warning) {
      delete (formatted as any).__warning
      return NextResponse.json({ ok: true, ...formatted, warning })
    }
    return NextResponse.json({ ok: true, ...formatted })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to format text"
    return NextResponse.json({ ok: true, ...fallbackFormat(rawText), warning: message }, { status: 200 })
  }
}
