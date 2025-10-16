import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDailyLimit } from "@/lib/rate-limit";

const PLUGIN_JWT_SECRET = new TextEncoder().encode(
  process.env.PLUGIN_JWT_SECRET || "dev-secret",
);

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.event_type)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const { payload } = await jwtVerify(token, PLUGIN_JWT_SECRET, { audience: "plugin" });
    const userId = String(payload.user_id || "");
    const orgId = payload.org_id ? String(payload.org_id) : undefined;
    const entitlements = (payload as unknown as { entitlements?: { limits?: Record<string, number> } }).entitlements;
    const units = Number(body.units ?? 1);

    // Enforce daily quota if available in entitlements
    const dailyMax = entitlements?.limits?.dailyRequests;
    if (dailyMax && dailyMax > 0) {
      const { allowed, remaining } = await checkDailyLimit({ userId, orgId, units, max: dailyMax });
      if (!allowed) {
        return NextResponse.json({ error: "Quota exceeded", limit: dailyMax, remaining }, { status: 429 });
      }
    }

    const supabase = await createSupabaseServerClient();
    await supabase.from("usage_events").insert({
      event_id: body.event_id ?? null,
      user_id: userId,
      org_id: orgId ?? null,
      installation_id: body.installation_id ?? null,
      event_type: body.event_type,
      units,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}