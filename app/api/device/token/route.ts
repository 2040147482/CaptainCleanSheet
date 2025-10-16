import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";
import { randomBytes } from "crypto";
import { getEntitlementsForUser } from "@/lib/entitlements";

const PLUGIN_JWT_SECRET = new TextEncoder().encode(process.env.PLUGIN_JWT_SECRET || "dev-secret");
const PLUGIN_TOKEN_TTL_MINUTES = Number(process.env.PLUGIN_TOKEN_TTL_MINUTES || "15");

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const supabase = await createSupabaseServerClient();

  const { data: dc, error: selErr } = await supabase
    .from("device_codes")
    .select("code,status,user_id,expires_at,claimed_at")
    .eq("code", code)
    .maybeSingle();
  if (selErr || !dc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dc.status !== "approved" || !dc.user_id) return NextResponse.json({ error: "Not approved" }, { status: 400 });
  if (dc.claimed_at) return NextResponse.json({ error: "Already claimed" }, { status: 400 });
  if (new Date(dc.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Expired" }, { status: 400 });

  const entitlements = await getEntitlementsForUser(dc.user_id);
  const expiresAt = Math.floor(Date.now() / 1000) + PLUGIN_TOKEN_TTL_MINUTES * 60;
  const accessToken = await new SignJWT({ aud: "plugin", user_id: dc.user_id, entitlements })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .setIssuer("captain-clean-sheet")
    .sign(PLUGIN_JWT_SECRET);

  const refreshToken = randomBytes(32).toString("hex");
  const { error: insErr } = await supabase.from("refresh_tokens").insert({
    token: refreshToken,
    user_id: dc.user_id,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  });
  if (insErr) return NextResponse.json({ error: "DB error" }, { status: 500 });

  await supabase.from("device_codes").update({ claimed_at: new Date().toISOString() }).eq("code", code);

  return NextResponse.json({ access_token: accessToken, expires_at: expiresAt, refresh_token: refreshToken });
}