import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/creem";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode: "at_period_end" | "immediate" = body?.mode || "immediate";

    const admin = createAdminClient();
    const { data: sub, error } = await admin
      .from("subscriptions")
      .select("subscription_id, customer_id")
      .eq("user_id", user.id)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !sub?.subscription_id) {
      return NextResponse.json({ error: "no_active_subscription" }, { status: 404 });
    }

    // 调用Creem API取消订阅
    const resp = await cancelSubscription(sub.subscription_id, mode);
    
    // 记录取消请求到数据库
    await admin
      .from("subscriptions")
      .update({
        cancellation_requested_at: new Date().toISOString(),
        cancellation_mode: mode,
        cancellation_effective_at: mode === "immediate" ? new Date().toISOString() : null,
        ...(mode === "immediate" ? { status: "canceled" } : {})
      })
      .eq("subscription_id", sub.subscription_id);

    // 如果是立即取消，则更新用户计划为free
    if (mode === "immediate") {
      await admin
        .from("profiles")
        .update({ 
          plan: "free",
          plan_expires: new Date().toISOString()
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ok: true, result: resp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}