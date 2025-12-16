import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const agents = [
  {
    name: "Sarah Johnson",
    avatar: "/professional-woman-avatar.png",
    deals: 8,
    revenue: 186500,
    conversion: 28,
    rank: 1,
  },
  {
    name: "Michael Torres",
    avatar: null,
    deals: 6,
    revenue: 142000,
    conversion: 24,
    rank: 2,
  },
  {
    name: "Emily Chen",
    avatar: null,
    deals: 5,
    revenue: 118000,
    conversion: 22,
    rank: 3,
  },
  {
    name: "David Kim",
    avatar: null,
    deals: 4,
    revenue: 95000,
    conversion: 20,
    rank: 4,
  },
]

export function AgentLeaderboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Leaderboard</CardTitle>
        <CardDescription>Top performers this quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center gap-4">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold">
                {agent.rank}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar || undefined} alt={agent.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.deals} deals · {agent.conversion}% conversion
                </p>
              </div>
              <Badge variant="secondary" className="font-semibold">
                €{(agent.revenue / 1000).toFixed(0)}k
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
