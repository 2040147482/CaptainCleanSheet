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
  // 返回最近 20 条 webhook 日志，使用 id 逆序以兼容缺少 received_at 的环境
  const { data, error } = await admin
    .from("webhooks_log")
    .select("id,event_id,type,status,received_at,error,digest")
    .order("id", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}