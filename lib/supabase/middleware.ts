import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

export async function updateSupabaseSession(request: NextRequest) {
  try {
    // The only supported way to forward session cookies in Next middleware is:
    // - read cookies from `request`
    // - write refreshed cookies to `response`
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    await supabase.auth.getUser()
    return response
  } catch {
    // Allow the app to load even if env vars aren't configured yet.
    return NextResponse.next({ request: { headers: request.headers } })
  }
}
