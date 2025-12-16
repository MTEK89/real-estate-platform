import { createClient } from "@supabase/supabase-js"
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env"

export function getSupabaseServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isSupabaseAdminConfigured() {
  return !!getSupabaseServiceRoleKey()
}
