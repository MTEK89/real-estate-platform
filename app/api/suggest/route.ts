import { NextRequest, NextResponse } from "next/server"

const useCases = [
  "photorealistic",
  "stylized/illustration",
  "product mockup",
  "minimalist",
  "sequential art",
  "accurate text rendering",
]

async function suggestWithOpenAI(idea: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.",
      useCase: useCases[0],
      narrative: "Please configure your OpenAI API key to get AI suggestions.",
      style: "Configure your environment variables first.",
      lighting: "Setup required for lighting suggestions.",
      camera: "API key needed for camera suggestions.",
      negatives: "Add your OpenAI API key to enable suggestions.",
    }
  }

  const systemPrompt = `
You are Nano Prompt Master, a specialist that translates any user request into a rigorous, machine‑friendly prompt for Google's Nano Banana (Gemini 2.5 Flash Image) editing/generation. Enforce explicit, quantified instructions and safe boundaries while honoring Google's narrative prompting recommendations and use‑case templates.

You are operating in a real-estate listing context. Prefer photorealistic, marketing-ready outputs and avoid unrealistic stylization unless explicitly requested.

Based on the user's idea: "${idea}", you will generate detailed suggestions for the following fields: useCase, narrative, style, lighting, camera, and negatives.

The use case must be one of the following: ${useCases.join(", ")}.

Guidelines for each field:
- "narrative": Create 2-4 coherent sentences describing scene/action, environment, mood per Google guidance. Build upon the user's original idea without changing it completely.
- "style": Provide specific, quantified style descriptions with palette, rendering feel, and artistic references. Use cinematic and artistic examples.
- "lighting": Specify exact lighting setup with key/fill/rim positions, color temperature in Kelvin, EV values, and softness levels.
- "camera": Define shot type, focal length in mm, aperture, grain ISO, depth of field, and composition rules.
- "negatives": Use semantic phrasing and technical quality terms.

Your response MUST be a valid JSON object with keys "useCase", "narrative", "style", "lighting", "camera", and "negatives".
Do not include any other text or markdown.
`.trim()

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate suggestions for the following idea: "${idea}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 600,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as any
  const content = data?.choices?.[0]?.message?.content
  return JSON.parse(content || "{}")
}

async function suggestWithDeepSeek(idea: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return null

  const systemPrompt = `
You are Nano Prompt Master, a specialist that translates any user request into a rigorous, machine‑friendly prompt for Google's Nano Banana (Gemini 2.5 Flash Image) editing/generation.

Based on the user's idea: "${idea}", generate JSON with keys "useCase", "narrative", "style", "lighting", "camera", and "negatives".
The use case must be one of: ${useCases.join(", ")}.
Do not include any other text or markdown.
`.trim()

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate suggestions for the following idea: "${idea}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as any
  const content = data?.choices?.[0]?.message?.content
  try {
    return JSON.parse(content || "{}")
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { idea } = (await req.json()) as { idea?: string }
    if (!idea) {
      return NextResponse.json({ error: "Idea is required." }, { status: 400 })
    }

    const deepSeek = await suggestWithDeepSeek(idea)
    if (deepSeek) return NextResponse.json(deepSeek)

    const suggestions = await suggestWithOpenAI(idea)
    const status = suggestions?.error ? 500 : 200
    return NextResponse.json(suggestions, { status })
  } catch (error) {
    console.error("Error generating AI suggestions:", error)
    return NextResponse.json(
      {
        useCase: "photorealistic",
        narrative: "A detailed scene depicting the idea. Focus on a compelling visual story with clear tone and atmosphere.",
        style: "Cinematic realism with professional lighting and composition",
        lighting: "Natural lighting with soft shadows and good contrast",
        camera: "Professional camera setup with balanced composition",
        negatives: "blurry, low quality, distorted, oversaturated, watermark, text",
      },
      { status: 200 },
    )
  }
}
