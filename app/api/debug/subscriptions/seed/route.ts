import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") || null;

  const admin = createAdminClient();
  const row = {
    user_id: userId,
    subscription_id: `sub_debug_${Date.now()}`,
    customer_id: `cust_debug_${Date.now()}`,
    plan: "pro",
    status: "active",
    current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  };
  const { data, error } = await admin.from("subscriptions").insert(row).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message || "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}