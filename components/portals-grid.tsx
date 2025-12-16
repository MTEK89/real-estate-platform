"use client"

import { Check, AlertCircle, Clock, Settings, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { portals, type Portal } from "@/lib/mock-data"

const statusConfig: Record<Portal["status"], { icon: typeof Check; color: string; label: string }> = {
  connected: { icon: Check, color: "text-emerald-500", label: "Connected" },
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
}

export function PortalsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {portals.map((portal) => {
        const status = statusConfig[portal.status]
        const StatusIcon = status.icon

        return (
          <Card key={portal.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-semibold text-lg">
                    {portal.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-base">{portal.name}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                      <span className={`text-xs ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                </div>
                <Switch checked={portal.status === "connected"} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active listings</span>
                <span className="font-medium">{portal.status === "connected" ? "2" : "0"}</span>
              </div>
	              <div className="flex gap-2 mt-4">
	                <Button
	                  variant="outline"
	                  size="sm"
	                  className="flex-1 bg-transparent"
	                  onClick={() => toast.info("Portal configuration coming soon.")}
	                >
	                  <Settings className="mr-1.5 h-3.5 w-3.5" />
	                  Configure
	                </Button>
	                <Button variant="outline" size="sm" onClick={() => toast.info("Open portal coming soon.")}>
	                  <ExternalLink className="h-3.5 w-3.5" />
	                </Button>
	              </div>
	            </CardContent>
	          </Card>
        )
      })}
    </div>
  )
}
