import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const customerId = new URL(req.url).searchParams.get("customer_id");
  if (!customerId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id,user_id,subscription_id,customer_id,plan,status,current_period_end,updated_at,created_at")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}