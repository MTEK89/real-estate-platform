import { Card, CardContent } from "@/components/ui/card"
import { contracts } from "@/lib/mock-data"
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react"

export function ContractStats() {
  const draft = contracts.filter((c) => c.status === "draft").length
  const pending = contracts.filter((c) => c.status === "pending_signature").length
  const signed = contracts.filter((c) => c.status === "signed").length
  const declined = contracts.filter((c) => c.status === "declined").length

  const stats = [
    {
      label: "Draft",
      value: draft,
      icon: FileText,
      color: "text-muted-foreground bg-muted",
    },
    {
      label: "Pending Signature",
      value: pending,
      icon: Clock,
      color: "text-amber-600 bg-amber-100",
    },
    {
      label: "Signed",
      value: signed,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Declined",
      value: declined,
      icon: XCircle,
      color: "text-red-600 bg-red-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-card-foreground">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
