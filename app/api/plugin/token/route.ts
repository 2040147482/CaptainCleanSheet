import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlementsForUser } from "@/lib/entitlements";

const PLUGIN_JWT_SECRET = new TextEncoder().encode(process.env.PLUGIN_JWT_SECRET || "dev-secret");
const PLUGIN_TOKEN_TTL_MINUTES = Number(process.env.PLUGIN_TOKEN_TTL_MINUTES || "15");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { refresh_token, pat } = body as { refresh_token?: string; pat?: string };
  if (!refresh_token && !pat) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;

  if (refresh_token) {
    const { data } = await supabase
      .from("refresh_tokens")
      .select("user_id,expires_at")
      .eq("token", refresh_token)
      .maybeSingle();
    if (!data || new Date(data.expires_at).getTime() < Date.now())
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    userId = data.user_id;
  } else if (pat) {
    const { data } = await supabase
      .from("api_keys")
      .select("user_id,status")
      .eq("plaintext_key", pat)
      .maybeSingle();
    if (!data || data.status !== "active")
      return NextResponse.json({ error: "Invalid PAT" }, { status: 401 });
    userId = data.user_id;
    // 可选：更新 last_used_at
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("plaintext_key", pat);
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entitlements = await getEntitlementsForUser(userId);
  const expiresAt = Math.floor(Date.now() / 1000) + PLUGIN_TOKEN_TTL_MINUTES * 60;
  const token = await new SignJWT({ aud: "plugin", user_id: userId, entitlements })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .setIssuer("captain-clean-sheet")
    .sign(PLUGIN_JWT_SECRET);

  return NextResponse.json({ access_token: token, expires_at: expiresAt });
}