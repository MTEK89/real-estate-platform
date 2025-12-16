import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient

  // Use cookie-based auth so server-side middleware/routes can read the session.
  browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())

  return browserClient
}
