"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
  Clock,
  Home,
  Sparkles,
  MessageCircle,
  Smartphone,
  Users,
  Star,
  Archive,
  Pin,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock message data
interface Message {
  id: string
  conversationId: string
  content: string
  timestamp: string
  sender: "me" | "them"
  status: "sent" | "delivered" | "read" | "pending"
  type: "text" | "image" | "document" | "location" | "property"
  propertyRef?: string
}

interface Conversation {
  id: string
  contactId: string
  channel: "whatsapp" | "sms"
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  pinned?: boolean
  archived?: boolean
}

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    contactId: "contact-1",
    channel: "whatsapp",
    lastMessage: "Parfait, je confirme pour demain 14h",
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
    pinned: true,
  },
  {
    id: "conv-2",
    contactId: "contact-2",
    channel: "whatsapp",
    lastMessage: "Merci pour les photos, le bien m'intéresse",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unreadCount: 1,
  },
  {
    id: "conv-3",
    contactId: "contact-3",
    channel: "sms",
    lastMessage: "Bonjour, pouvez-vous m'envoyer plus d'infos ?",
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
  },
  {
    id: "conv-4",
    contactId: "contact-4",
    channel: "whatsapp",
    lastMessage: "D'accord, je vous rappelle demain",
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    archived: true,
  },
]

const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      content: "Bonjour, je suis intéressé par l'appartement sur Kirchberg",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: "them",
      status: "read",
      type: "text",
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      content: "Bonjour ! Bien sûr, c'est un très beau bien. Quand seriez-vous disponible pour une visite ?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      sender: "me",
      status: "read",
      type: "text",
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      content: "Je peux demain après-midi, vers 14h ?",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      sender: "them",
      status: "read",
      type: "text",
    },
    {
      id: "msg-4",
      conversationId: "conv-1",
      content: "LUX-2024-001",
      timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
      sender: "me",
      status: "delivered",
      type: "property",
      propertyRef: "LUX-2024-001",
    },
    {
      id: "msg-5",
      conversationId: "conv-1",
      content: "Parfait, je confirme pour demain 14h",
      timestamp: new Date().toISOString(),
      sender: "them",
      status: "read",
      type: "text",
    },
    {
      id: "msg-6",
      conversationId: "conv-1",
      content: "Super ! Je vous envoie l'adresse exacte",
      timestamp: new Date().toISOString(),
      sender: "me",
      status: "pending",
      type: "text",
    },
  ],
  "conv-2": [
    {
      id: "msg-10",
      conversationId: "conv-2",
      content: "Merci pour les photos, le bien m'intéresse",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: "them",
      status: "read",
      type: "text",
    },
  ],
}

// Quick reply templates
const QUICK_REPLIES = [
  { id: "available", text: "Je suis disponible, quand pouvez-vous ?" },
  { id: "confirm", text: "Je confirme le rendez-vous" },
  { id: "thanks", text: "Merci, je reviens vers vous rapidement" },
  { id: "call", text: "Pouvons-nous en discuter par téléphone ?" },
  { id: "address", text: "Voici l'adresse exacte du bien :" },
]

export default function MessagesPage() {
  const { contacts, properties, deals } = useDataStore()
  const [activeChannel, setActiveChannel] = useState<"all" | "whatsapp" | "sms">("all")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter((c) => !c.archived)

    if (activeChannel !== "all") {
      filtered = filtered.filter((c) => c.channel === activeChannel)
    }

    if (searchQuery) {
      filtered = filtered.filter((c) => {
        const contact = contacts.find((ct) => ct.id === c.contactId)
        const name = contact ? `${contact.firstName} ${contact.lastName}`.toLowerCase() : ""
        return (
          name.includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Sort: pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })
  }, [conversations, activeChannel, searchQuery, contacts])

  // Get current conversation messages
  const currentMessages = selectedConversation ? messages[selectedConversation.id] || [] : []

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: "me",
      status: "pending",
      type: "text",
    }

    setMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), newMsg],
    }))

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
          : c,
      ),
    )

    setNewMessage("")

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: prev[selectedConversation.id].map((m) =>
          m.id === newMsg.id ? { ...m, status: "delivered" } : m,
        ),
      }))
    }, 1000)
  }

  const handleQuickReply = (text: string) => {
    setNewMessage(text)
    setShowQuickReplies(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-LU", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Hier"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-LU", { weekday: "short" })
    }
    return date.toLocaleDateString("fr-LU", { day: "numeric", month: "short" })
  }

  const getContactForConversation = (conv: Conversation) => {
    return (
      contacts.find((c) => c.id === conv.contactId) || {
        firstName: "Contact",
        lastName: "Inconnu",
        phone: "",
      }
    )
  }

  const totalUnread = conversations.filter((c) => !c.archived).reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title="Messages"
        description="WhatsApp et SMS - Communiquez avec vos clients"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {totalUnread} non lu(s)
            </Badge>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col">
          {/* Channel Tabs */}
          <div className="p-3 border-b">
            <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as typeof activeChannel)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1 gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Tous
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex-1 gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex-1 gap-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">Aucune conversation</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const contact = getContactForConversation(conv)
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv)
                      // Mark as read
                      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)))
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b",
                      selectedConversation?.id === conv.id && "bg-muted",
                      conv.unreadCount > 0 && "bg-primary/5",
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {contact.firstName[0]}
                          {contact.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {/* Channel indicator */}
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
                          conv.channel === "whatsapp" ? "bg-green-500" : "bg-blue-500",
                        )}
                      >
                        {conv.channel === "whatsapp" ? (
                          <MessageCircle className="h-3 w-3 text-white" />
                        ) : (
                          <Smartphone className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("font-medium truncate", conv.unreadCount > 0 && "font-semibold")}>
                          {contact.firstName} {contact.lastName}
                        </span>
                        <div className="flex items-center gap-1">
                          {conv.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate mt-0.5",
                          conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground",
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-green-500 text-white h-5 min-w-5 px-1.5">{conv.unreadCount}</Badge>
                    )}
                  </button>
                )
              })
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getContactForConversation(selectedConversation).firstName[0]}
                      {getContactForConversation(selectedConversation).lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getContactForConversation(selectedConversation).firstName}{" "}
                      {getContactForConversation(selectedConversation).lastName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedConversation.channel === "whatsapp" ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          WhatsApp
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-3 w-3" />
                          SMS
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pin className="mr-2 h-4 w-4" />
                        {selectedConversation.pinned ? "Désépingler" : "Épingler"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="mr-2 h-4 w-4" />
                        Marquer important
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.sender === "me"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md",
                        )}
                      >
                        {message.type === "property" ? (
                          <Card className="bg-background/80 border-0 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Home className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{message.propertyRef}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Appartement - Kirchberg</p>
                              <p className="text-sm font-semibold mt-1">850 000 €</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            message.sender === "me" ? "justify-end" : "justify-start",
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs",
                              message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender === "me" && (
                            <>
                              {message.status === "pending" && <Clock className="h-3 w-3 text-primary-foreground/70" />}
                              {message.status === "sent" && <Check className="h-3 w-3 text-primary-foreground/70" />}
                              {message.status === "delivered" && (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              )}
                              {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-300" />}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Replies */}
              {showQuickReplies && (
                <div className="border-t p-2 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <Button
                        key={reply.id}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-background"
                        onClick={() => handleQuickReply(reply.text)}
                      >
                        {reply.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Écrivez un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {newMessage.trim() ? (
                    <Button size="icon" onClick={handleSendMessage}>
                      <Send className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon">
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Vos messages</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Sélectionnez une conversation pour afficher les messages WhatsApp et SMS avec vos clients
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
