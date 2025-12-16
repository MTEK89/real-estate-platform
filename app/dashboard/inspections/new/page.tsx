import { Suspense } from "react"
import { NewInspectionClient } from "./new-inspection-client"
import type { InspectionType } from "@/lib/inspections"

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : ""
}

export default function NewInspectionPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const propertyId = asString(searchParams.propertyId)
  const landlordId = asString(searchParams.landlordId)
  const tenantId = asString(searchParams.tenantId)
  const typeRaw = asString(searchParams.type) as InspectionType | ""
  const type: InspectionType = typeRaw === "move_out" ? "move_out" : "move_in"

  return (
    <Suspense>
      <NewInspectionClient propertyId={propertyId} landlordId={landlordId} tenantId={tenantId} type={type} />
    </Suspense>
  )
}

