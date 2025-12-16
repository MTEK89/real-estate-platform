import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { z } from "zod"
import path from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type McpTool = Awaited<ReturnType<Client["listTools"]>>["tools"][number]

const MCP_SERVER_PATH =
  process.env.REAL_ESTATE_MCP_SERVER_PATH ||
  path.join(process.cwd(), "mcp/real-estate-agent-server/dist/index.js")

let mcpClient: Client | null = null
let mcpTools: McpTool[] | null = null
let mcpInitPromise: Promise<void> | null = null

function safeJson(value: unknown, maxLen = 2000): string {
  try {
    const text = JSON.stringify(value)
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
  } catch {
    return "[unserializable]"
  }
}

function contentToText(content: Array<{ type: string; [k: string]: unknown }>): string {
  const parts: string[] = []
  for (const item of content) {
    if (item.type === "text" && typeof item.text === "string") parts.push(item.text)
    else if (item.type === "image" && typeof item.mimeType === "string") parts.push(`[image:${item.mimeType}]`)
    else if (item.type === "audio" && typeof item.mimeType === "string") parts.push(`[audio:${item.mimeType}]`)
  }
  return parts.join("\n").trim()
}

function buildToolCatalog(tools: McpTool[], max = 80): string {
  const lines: string[] = []
  for (const t of tools.slice(0, max)) lines.push(`- ${t.name}: ${t.description || "(no description)"}`)
  if (tools.length > max) lines.push(`- …and ${tools.length - max} more tools`)
  return lines.join("\n")
}

function getMcpEnv(): Record<string, string> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""

  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseKey,
    FAL_KEY: process.env.FAL_KEY || "",
  }
}

async function ensureMcpConnected(): Promise<{ tools: McpTool[]; needsAgencyId: Map<string, boolean> }> {
  if (mcpInitPromise) {
    await mcpInitPromise
    if (!mcpClient || !mcpTools) throw new Error("MCP client not ready")
    return {
      tools: mcpTools,
      needsAgencyId: new Map(mcpTools.map((t) => [t.name, Boolean(t.inputSchema?.properties?.agency_id)])),
    }
  }

  mcpInitPromise = (async () => {
    const client = new Client({ name: "real-estate-platform-web", version: "0.1.0" }, { capabilities: {} })
    const transport = new StdioClientTransport({
      command: "node",
      args: [MCP_SERVER_PATH],
      env: getMcpEnv(),
      stderr: "pipe",
    })

    const stderr = transport.stderr
    if (stderr) {
      stderr.on("data", (chunk) => {
        const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk)
        const trimmed = text.trim()
        if (trimmed) console.warn(`[MCP] ${trimmed}`)
      })
    }

    await client.connect(transport)
    const { tools } = await client.listTools()

    mcpClient = client
    mcpTools = tools
  })().catch((err) => {
    mcpInitPromise = null
    mcpClient = null
    mcpTools = null
    throw err
  })

  await mcpInitPromise
  if (!mcpClient || !mcpTools) throw new Error("MCP client not ready")

  return {
    tools: mcpTools,
    needsAgencyId: new Map(mcpTools.map((t) => [t.name, Boolean(t.inputSchema?.properties?.agency_id)])),
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenant(req)
    if ("response" in ctx) return ctx.response
    const { tenant, applyCookies } = ctx

    const { message, history = [] } = await req.json()
    if (!message) return applyCookies(NextResponse.json({ error: "Message is required" }, { status: 400 }))

    if (!process.env.OPENAI_API_KEY) {
      return applyCookies(NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 }))
    }

    const defaultAgencyId = tenant.agencyId
    const { tools, needsAgencyId } = await ensureMcpConnected()
    if (tools.length === 0) {
      return applyCookies(NextResponse.json({ error: "MCP server returned no tools" }, { status: 500 }))
    }

    const toolNames = tools.map((t) => t.name)
    // Ensure we have at least one tool name for the enum
    if (toolNames.length === 0) {
      return applyCookies(NextResponse.json({ error: "No valid tool names found" }, { status: 500 }))
    }
    const toolNameEnum = z.enum(toolNames as [string, ...string[]])

    const systemPrompt = `You are a real-estate productivity assistant for a Luxembourg real-estate agency.

You have access to the agency's MCP server tools (CRM, properties, visits, tasks, contracts, AI photo workflows).
When the user asks you to do something, prefer using MCP tools instead of guessing.

Rules:
- Use the MCP tool that best matches the user's intent.
- If required details are missing, ask a short follow-up question.
- Many tools require \`agency_id\`. If not provided, use default \`${defaultAgencyId}\`.
- After executing a tool, summarize the result clearly and include any IDs/next steps.

Available MCP tools:
${buildToolCatalog(tools)}
`

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history
        .filter((h: { role: string; content: string }) => h?.role === "user" || h?.role === "assistant")
        .map((h: { role: string; content: string }) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
      { role: "user" as const, content: message },
    ]

    const mcpCallTool = tool({
      description:
        "Call a tool on the Real Estate MCP server. Use this for CRUD, workflows (create listing, schedule visit, prepare contract), and AI photo operations.",
      parameters: z.object({
        toolName: toolNameEnum.describe("MCP tool name to call"),
        input: z.record(z.any()).default({}).describe("Tool input object (match tool schema)"),
      }),
      execute: async ({ toolName, input }) => {
        const client = mcpClient
        if (!client) throw new Error("MCP client not connected")

        const args: Record<string, unknown> = { ...(input || {}) }
        if (needsAgencyId.get(toolName) && typeof args.agency_id === "undefined") args.agency_id = defaultAgencyId

        const result = await client.callTool({ name: toolName, arguments: args })
        return contentToText(result.content as Array<{ type: string; [k: string]: unknown }>)
      },
    })

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages,
      tools: { mcp_call: mcpCallTool },
      maxSteps: 8,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "content", content: part.text })}\n\n`),
              )
              continue
            }

            if (part.type === "tool-call") {
              let name = part.toolName
              if (name === "mcp_call" && part.input && typeof part.input === "object") {
                const maybeName = (part.input as Record<string, unknown>).toolName
                if (typeof maybeName === "string") name = maybeName
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name })}\n\n`))
              continue
            }

            if (part.type === "tool-result") {
              let name = part.toolName
              if (name === "mcp_call" && part.input && typeof part.input === "object") {
                const maybeName = (part.input as Record<string, unknown>).toolName
                if (typeof maybeName === "string") name = maybeName
              }
              const outputText = typeof part.output === "string" ? part.output : safeJson(part.output)
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name, result: outputText })}\n\n`),
              )
              continue
            }

            if (part.type === "tool-error") {
              let name = part.toolName
              if (name === "mcp_call" && part.input && typeof part.input === "object") {
                const maybeName = (part.input as Record<string, unknown>).toolName
                if (typeof maybeName === "string") name = maybeName
              }
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_result",
                    name,
                    result: `ERROR: ${String(part.error)}`,
                  })}\n\n`,
                ),
              )
              continue
            }

            if (part.type === "error") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    message: part.error instanceof Error ? part.error.message : "Unknown error",
                  })}\n\n`,
                ),
              )
              break
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              })}\n\n`,
            ),
          )
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }
      },
    })

    const res = new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
    return applyCookies(res)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

