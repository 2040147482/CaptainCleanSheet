import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlementsForUser } from "@/lib/entitlements";
import { SignJWT } from "jose";

const TOKEN_COOKIE = "captain_token";
const REFRESH_COOKIE = "captain_refresh";

function siteCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
  };
}

export async function POST(req: NextRequest) {
  // Issue a short-lived plugin JWT and set cookie for extensions to read
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entitlements = await getEntitlementsForUser(user.id);
  const secret = new TextEncoder().encode(process.env.PLUGIN_JWT_SECRET || "dev-secret-change-me");
  const ttlSeconds = Number(process.env.PLUGIN_JWT_TTL_SECONDS || 3600);

  const jwt = await new SignJWT({
    sub: user.id,
    user_id: user.id,
    email: user.email,
    entitlements,
    typ: "plugin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("plugin")
    .setIssuer("captain-clean-sheet")
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);

  // Optional: also mint a refresh token for plugin flows
  // We reuse the existing /api/plugin/token endpoint semantics, so here
  // we only set cookies; storage of refresh tokens happens in DB via that endpoint.
  const refreshTtlDays = Number(process.env.PLUGIN_REFRESH_TTL_DAYS || 30);
  const refreshExpires = refreshTtlDays * 24 * 3600;

  // For now, we set an empty refresh cookie if not configured; in a real flow,
  // the frontend may call /api/plugin/token with a persistent refresh token later.
  const res = NextResponse.json({ ok: true, accessToken: jwt, expiresIn: ttlSeconds });
  res.cookies.set(TOKEN_COOKIE, jwt, siteCookieOptions(ttlSeconds));

  // Only set refresh cookie if provided in payload (future-proof). Currently we skip real issuance here.
  // Users can opt to store a refresh token cookie by posting JSON { refreshToken }.
  try {
    const body = await req.json().catch(() => null);
    if (body?.refreshToken) {
      res.cookies.set(REFRESH_COOKIE, body.refreshToken, siteCookieOptions(refreshExpires));
    }
  } catch (_) {}

  return res;
}

export async function DELETE() {
  // Clear captain_token and captain_refresh cookies
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_COOKIE, "", { ...siteCookieOptions(), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...siteCookieOptions(), maxAge: 0 });
  return res;
}