import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCustomerPortalLink } from "@/lib/creem";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    // Find latest subscription to obtain customer_id, prefer non-null customer_id
    const { data: subByCustomer } = await admin
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", user.id)
      .not("customer_id", "is", null)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = subByCustomer ?? (
      await admin
        .from("subscriptions")
        .select("customer_id")
        .eq("user_id", user.id)
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;

    const customerId: string | undefined = sub?.customer_id;
    if (!customerId) {
      return NextResponse.json({ error: "no_customer_id" }, { status: 404 });
    }

    const link = await generateCustomerPortalLink(customerId);
    return NextResponse.json({ url: link.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}