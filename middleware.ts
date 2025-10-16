import { updateSession } from "@/lib/supabase/middleware";
import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "always",
});

export async function middleware(request: NextRequest) {
  const res = intlMiddleware(request);
  // If next-intl performs a redirect, return it immediately
  if (res.headers.get("location")) {
    return res;
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude API and static assets from locale middleware
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/", // root redirects to default locale
  ],
};
