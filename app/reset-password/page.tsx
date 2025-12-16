import { Suspense } from "react"
import { ResetPasswordClient } from "@/app/reset-password/reset-password-client"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  )
}

