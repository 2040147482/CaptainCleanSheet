import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlementsForUser } from "@/lib/entitlements";

const PLUGIN_JWT_SECRET = new TextEncoder().encode(
  process.env.PLUGIN_JWT_SECRET || "dev-secret",
);
const PLUGIN_TOKEN_TTL_MINUTES = Number(
  process.env.PLUGIN_TOKEN_TTL_MINUTES || "15",
);

async function getUserFromSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id };
}

export async function POST() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entitlements = await getEntitlementsForUser(user.userId);

  const expiresAt = Math.floor(Date.now() / 1000) + PLUGIN_TOKEN_TTL_MINUTES * 60;
  const token = await new SignJWT({
    aud: "plugin",
    user_id: user.userId,
    entitlements,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .setIssuer("captain-clean-sheet")
    .sign(PLUGIN_JWT_SECRET);

  return NextResponse.json({ access_token: token, expires_at: expiresAt });
}