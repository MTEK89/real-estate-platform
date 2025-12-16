"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Home,
  Building2,
  Users,
  Calendar,
  FileText,
  Camera,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

// Message types
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  status: "pending" | "streaming" | "complete" | "error"
  toolCalls?: ToolCall[]
}

interface ToolCall {
  name: string
  status: "pending" | "running" | "complete" | "error"
  result?: string
}

// Quick action suggestions
const quickActions = [
  {
    icon: Home,
    label: "Dashboard",
    prompt: "Show me my dashboard for today",
    color: "text-blue-500",
  },
  {
    icon: Building2,
    label: "Properties",
    prompt: "Search for available properties",
    color: "text-emerald-500",
  },
  {
    icon: Users,
    label: "Contacts",
    prompt: "Show me my recent contacts",
    color: "text-purple-500",
  },
  {
    icon: Calendar,
    label: "Visits",
    prompt: "What visits do I have scheduled this week?",
    color: "text-orange-500",
  },
  {
    icon: FileText,
    label: "Contracts",
    prompt: "Show me pending contracts",
    color: "text-pink-500",
  },
  {
    icon: Camera,
    label: "AI Photos",
    prompt: "What AI photo tools are available?",
    color: "text-cyan-500",
  },
]

// Example prompts for empty state
const examplePrompts = [
  "Create a new listing for a 3-bedroom apartment at 15 Grand Rue, Luxembourg, priced at 650,000 EUR",
  "Schedule a visit with Marie Dupont for property APT-001 tomorrow at 2pm",
  "Prepare a mandate contract for the house at Strassen with owner Jean Martin",
  "Show me all properties under 500,000 EUR",
  "What are my urgent tasks for today?",
  "Draft an email to follow up with potential buyers",
]

export default function AgentChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async (promptOverride?: string) => {
    const messageText = promptOverride || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      status: "complete",
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "pending",
      toolCalls: [],
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        // Try to surface server-provided error messages (e.g., NO_AGENCY)
        let serverMessage = `HTTP error! status: ${response.status}`
        try {
          const data = await response.json()
          if (data?.error) serverMessage = data.error
        } catch {
          // ignore
        }

        if (response.status === 409) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content:
                      "You don’t have an agency set up yet. Go to **Onboarding** and create your agency, then come back here.\n\nPath: `/dashboard/onboarding`",
                    status: "complete",
                  }
                : m
            )
          )
          toast.error("Create an agency first (Onboarding)")
          setIsLoading(false)
          return
        }

        throw new Error(serverMessage)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let fullContent = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by a blank line
        while (true) {
          const separatorIndex = buffer.indexOf("\n\n")
          if (separatorIndex === -1) break

          const rawEvent = buffer.slice(0, separatorIndex)
          buffer = buffer.slice(separatorIndex + 2)

          const dataLines = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.replace(/^data:\s?/, ""))

          if (dataLines.length === 0) continue

          const data = dataLines.join("\n")
          if (data === "[DONE]") continue

          const parsed = JSON.parse(data)

          if (parsed.type === "content") {
            fullContent += parsed.content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: fullContent, status: "streaming" }
                  : m
              )
            )
          } else if (parsed.type === "tool_call") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      toolCalls: [
                        ...(m.toolCalls || []),
                        { name: parsed.name, status: "running" },
                      ],
                    }
                  : m
              )
            )
          } else if (parsed.type === "tool_result") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      toolCalls: m.toolCalls?.map((tc) =>
                        tc.name === parsed.name
                          ? {
                              ...tc,
                              status: "complete",
                              result: parsed.result,
                            }
                          : tc
                      ),
                    }
                  : m
              )
            )
          } else if (parsed.type === "error") {
            throw new Error(parsed.message)
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, status: "complete" }
            : m
        )
      )
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: "Sorry, I encountered an error. Please try again.",
                status: "error",
              }
            : m
        )
      )
      toast.error("Failed to get response from agent")
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClearChat = () => {
    setMessages([])
    toast.success("Chat cleared")
  }

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === "user") {
        // Remove the failed assistant message and retry
        setMessages(prev => prev.slice(0, messageIndex))
        handleSend(userMessage.content)
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title="AI Agent"
        description="Chat with your real estate assistant powered by MCP"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            OpenAI + MCP
          </Badge>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </DashboardHeader>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Quick Actions Bar */}
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Quick actions:
            </span>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="gap-1.5 whitespace-nowrap"
                onClick={() => handleSend(action.prompt)}
                disabled={isLoading}
              >
                <action.icon className={cn("h-3.5 w-3.5", action.color)} />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-6 rounded-full bg-primary/10 p-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Real Estate AI Agent
                </h3>
                <p className="mb-8 max-w-md text-center text-muted-foreground">
                  I can help you manage properties, contacts, visits, contracts,
                  and more. Just ask me anything in natural language!
                </p>

                <div className="w-full max-w-lg space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Try asking:
                  </p>
                  {examplePrompts.slice(0, 4).map((prompt, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleSend(prompt)}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{prompt}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Messages
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        "flex max-w-[80%] flex-col gap-1",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {/* Tool calls indicator */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {message.toolCalls.map((tc, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="gap-1 text-xs"
                            >
                              {tc.status === "running" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : tc.status === "complete" ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {tc.name.replace("re_", "")}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Message content */}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {message.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-semibold mt-3 mb-2">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-semibold mt-2 mb-1">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 mb-2">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-4 mb-2">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="mb-1">{children}</li>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className
                                  return isInline ? (
                                    <code className="bg-background/50 rounded px-1 py-0.5 text-xs font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-background/50 rounded p-2 text-xs font-mono overflow-x-auto">
                                      {children}
                                    </code>
                                  )
                                },
                                strong: ({ children }) => (
                                  <strong className="font-semibold">{children}</strong>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>

                      {/* Message actions */}
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.role === "assistant" &&
                          message.status === "complete" && (
                            <>
                              <Separator
                                orientation="vertical"
                                className="mx-1 h-3"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopy(message.content, message.id)
                                }
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                        {message.status === "error" && (
                          <>
                            <Separator
                              orientation="vertical"
                              className="mx-1 h-3"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1 text-xs"
                              onClick={() => handleRetry(message.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </Button>
                          </>
                        )}
                        {message.status === "error" && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask your agent anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Powered by OpenAI + Real Estate MCP Server
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
