import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { updateSupabaseSession } from "@/lib/supabase/middleware"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import { rateLimitMiddleware } from "@/lib/rate-limit"

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const response = await updateSupabaseSession(request)

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith("/dashboard")
  const isResetPassword = pathname === "/reset-password"
  const isAcceptInvite = pathname === "/accept-invite"

  if (!isDashboard && pathname !== "/login" && pathname !== "/onboarding" && !isResetPassword && !isAcceptInvite)
    return response

  let user: any = null
  try {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    user = u
  } catch {
    // If env vars aren't configured yet, don't block navigation with auth redirects.
    return response
  }

  if (!user && (isDashboard || pathname === "/onboarding" || isResetPassword || isAcceptInvite)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/onboarding", "/reset-password", "/accept-invite", "/api/:path*"],
}
