import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Build the redirect response up front so we can attach session cookies to IT.
  const response = NextResponse.redirect(new URL("/", url));

  if (code) {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            response.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: CookieOptions) => {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      },
    );
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      // Send them back to login with a hint instead of looping.
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url));
    }
  }

  return response;
}
