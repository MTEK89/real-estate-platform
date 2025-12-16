import { Suspense } from "react"
import { NewMarketingDocumentClient } from "./new-marketing-document-client"

function asString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

export default async function NewMarketingDocumentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedParams = await searchParams
  const type = asString(resolvedParams?.type)
  const propertyId = asString(resolvedParams?.propertyId)
  const contactId = asString(resolvedParams?.contactId) || asString(resolvedParams?.agentId)

  return (
    <Suspense>
      <NewMarketingDocumentClient initialType={type} initialPropertyId={propertyId} initialAgentId={contactId} />
    </Suspense>
  )
}

