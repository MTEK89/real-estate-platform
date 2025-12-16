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
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.",
          description: "Reference image analysis requires API configuration.",
          useCase: useCases[0],
          narrative: "Please configure your API key to analyze reference images.",
          style: "Configure your environment variables first.",
          lighting: "Setup required for lighting analysis.",
          camera: "API key needed for camera suggestions.",
          negatives: "Add your OpenAI API key to enable reference analysis.",
        },
        { status: 500 },
      )
    }

    const { image, idea } = (await req.json()) as { image?: string; idea?: string }
    if (!image || !idea) {
      return NextResponse.json({ error: "Image and idea are required" }, { status: 400 })
    }

    const systemPrompt = `
You are Nano Prompt Master, a specialist that analyzes reference images and user ideas to create rigorous, machine‑friendly prompts for Google's Nano Banana (Gemini 2.5 Flash Image) editing/generation.

You are operating in a real-estate listing context. Prioritize photorealistic results, architectural fidelity, natural lighting, and marketing-ready composition. Do not add misleading structural elements.

Based on the user's idea and the reference image, generate JSON with keys: description, useCase, narrative, style, lighting, camera, negatives.
The use case must be one of: ${useCases.join(", ")}.
No markdown.
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
              {
                type: "text",
                text: `Analyze this reference image and generate Nano Prompt Master suggestions for the user's idea: "${idea}".`,
              },
              { type: "image_url", image_url: { url: image, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1100,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as any
    const content = data?.choices?.[0]?.message?.content
    const analysis = JSON.parse(content || "{}")
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error analyzing reference:", error)
    return NextResponse.json(
      {
        description:
          "Analysis of reference image combined with the idea. The reference provides visual style and composition guidance.",
        useCase: "photorealistic",
        narrative:
          "A visually compelling scene inspired by the reference image, incorporating the user idea with careful attention to composition, lighting, and mood.",
        style: "Professional style that balances the reference aesthetic with the user's vision",
        lighting: "Balanced lighting that complements the reference mood while enhancing the concept",
        camera: "Thoughtful composition that respects reference layout while adapting to the new concept",
        negatives: "blurry, low quality, distorted, inconsistent with reference style, poor composition",
      },
      { status: 200 },
    )
  }
}
