import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upgradeSubscription } from "@/lib/creem";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan: "pro" | "team" | undefined = body?.plan;
    const productIdInput: string | undefined = body?.product_id;
    const updateBehavior: "proration-charge-immediately" | "proration-charge" | "proration-none" = body?.update_behavior || "proration-charge-immediately";

    const admin = createAdminClient();
    const { data: sub, error } = await admin
      .from("subscriptions")
      .select("subscription_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (error || !sub?.subscription_id) {
      return NextResponse.json({ error: "no_active_subscription" }, { status: 404 });
    }

    // Map plan to product id if not provided
    const proId = process.env.CREEM_PRICE_PRO_MONTHLY_ID || "";
    const teamId = process.env.CREEM_PRICE_PRO_TEAM_ID || "";
    const productId = productIdInput || (plan === "pro" ? proId : plan === "team" ? teamId : "");
    if (!productId) return NextResponse.json({ error: "product_id_or_plan_required" }, { status: 400 });

    const resp = await upgradeSubscription(sub.subscription_id, productId, updateBehavior);
    return NextResponse.json({ ok: true, result: resp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}