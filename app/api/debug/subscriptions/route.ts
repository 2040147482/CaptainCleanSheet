import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id,subscription_id,customer_id,plan,status,current_period_end,updated_at,created_at")
    .eq("user_id", user.id)
    .order("current_period_end", { ascending: false })
    .limit(5);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}