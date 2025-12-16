import { Suspense } from "react"
import { AcceptInviteClient } from "@/app/accept-invite/accept-invite-client"

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteClient />
    </Suspense>
  )
}

