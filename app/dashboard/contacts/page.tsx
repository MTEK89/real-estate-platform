"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ContactTable } from "@/components/contact-table"
import { ContactFilters } from "@/components/contact-filters"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/data-store"
import { Plus, Upload } from "lucide-react"
import Link from "next/link"

export default function ContactsPage() {
  const { contacts } = useDataStore()

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Contacts"
        description={`${contacts.length} contacts in your CRM`}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/contacts/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </Link>
            <Link href="/dashboard/contacts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <ContactFilters />
        <ContactTable />
      </div>
    </div>
  )
}
