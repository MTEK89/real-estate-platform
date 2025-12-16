import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

type CookieToSet = {
  name: string
  value: string
  // Next's cookie option types differ between runtimes; keep permissive here.
  options?: any
}

export function createSupabaseRouteClient(req: NextRequest) {
  const cookiesToSet: CookieToSet[] = []

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookies) {
        cookies.forEach((c) => {
          cookiesToSet.push({ name: c.name, value: c.value, options: c.options })
        })
      },
    },
  })

  return {
    supabase,
    applyCookies<T extends { cookies: { set: (name: string, value: string, options?: any) => unknown } }>(res: T) {
      cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options))
      return res
    },
  }
}
