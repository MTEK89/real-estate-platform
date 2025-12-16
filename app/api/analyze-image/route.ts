import { NextRequest, NextResponse } from "next/server"

const useCases = [
  "photorealistic",
  "stylized/illustration",
  "product mockup",
  "minimalist",
  "sequential art",
  "accurate text rendering",
]

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment for image analysis.",
          description: "Please configure your OpenAI API key to get AI image analysis.",
          useCase: useCases[0],
          narrative: "Please configure your OpenAI API key to get AI image analysis.",
          style: "Configure your environment variables first.",
          lighting: "Setup required for lighting suggestions.",
          camera: "API key needed for camera suggestions.",
          negatives: "Add your OpenAI API key to enable image analysis.",
        },
        { status: 500 },
      )
    }

    const { image } = (await req.json()) as { image?: string }
    if (!image) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 })
    }

    const systemPrompt = `
You are Nano Prompt Master, a specialist that translates any user request into a rigorous, machine‑friendly prompt for Google's Nano Banana (Gemini 2.5 Flash Image) editing/generation.

You are operating in a real-estate listing context. Prioritize photorealistic results, architectural fidelity, natural lighting, and clean edits suitable for property marketing. Do not stylize unless explicitly requested.

Based on the uploaded image, generate detailed suggestions for: description, useCase, narrative, style, lighting, camera, negatives.
The use case must be one of: ${useCases.join(", ")}.

Return a JSON object with keys "description", "useCase", "narrative", "style", "lighting", "camera", and "negatives". No markdown.
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
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and generate suggestions for image-to-image prompt generation." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as any
    const content = data?.choices?.[0]?.message?.content
    const suggestions = JSON.parse(content || "{}")
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json(
      {
        description: "A visually interesting image with compelling composition and lighting.",
        useCase: "photorealistic",
        narrative: "Enhance the existing composition while preserving the core subject and mood.",
        style: "Cinematic realism with professional lighting and composition",
        lighting: "Natural lighting with soft shadows and good contrast",
        camera: "Professional camera setup with balanced composition",
        negatives: "blurry, low quality, distorted, oversaturated, watermark, text",
      },
      { status: 200 },
    )
  }
}
