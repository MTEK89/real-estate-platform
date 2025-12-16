import { generateText } from "ai"

export async function POST(req: Request) {
  const { context, tone, originalEmail, contactName, propertyInfo } = await req.json()

  const systemPrompt = `You are a professional real estate agent assistant. Your task is to draft professional, friendly emails for real estate communications.

Guidelines:
- Be professional but warm and approachable
- Keep emails concise and to the point
- Include relevant property details when provided
- Use proper French business email etiquette if needed
- Always be helpful and solution-oriented
- End with a clear call to action when appropriate

Tone: ${tone || "professional"}
${contactName ? `Client name: ${contactName}` : ""}
${propertyInfo ? `Property context: ${propertyInfo}` : ""}`

  const userPrompt = originalEmail
    ? `Please draft a professional reply to this email:\n\n"${originalEmail}"\n\nContext: ${context || "General response"}`
    : `Please draft an email with the following context: ${context}`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 1000,
      temperature: 0.7,
    })

    return Response.json({ draft: text })
  } catch (error) {
    console.error("AI draft error:", error)
    return Response.json({ error: "Failed to generate draft" }, { status: 500 })
  }
}
