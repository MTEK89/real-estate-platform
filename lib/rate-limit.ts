import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Get current rate limit data for IP
  const current = rateLimit.get(ip);

  // Reset window if expired
  if (current && now > current.resetTime) {
    rateLimit.delete(ip);
  }

  // Check if limit exceeded
  if (current && current.count >= MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString(),
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  // Update counter
  if (current) {
    current.count++;
  } else {
    rateLimit.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add rate limit headers
  const data = rateLimit.get(ip)!;
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - data.count).toString());
  response.headers.set('X-RateLimit-Reset', data.resetTime.toString());

  return response;
}