import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type Entitlements = {
  plan: string;
  features: string[];
  limits: Record<string, number>;
};

export async function getEntitlementsForUser(userId: string, orgId?: string): Promise<Entitlements> {
  const supabase = await createSupabaseServerClient();
  const defaultEntitlements: Entitlements = {
    plan: "free",
    features: ["basic"],
    limits: { dailyRequests: 50 },
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq(orgId ? "org_id" : "user_id", orgId ?? userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return defaultEntitlements;

  const plan = data.plan ?? "free";
  switch (plan) {
    case "pro":
      return { plan: "pro", features: ["basic", "pro"], limits: { dailyRequests: 1000 } };
    case "team":
      return { plan: "team", features: ["basic", "pro", "team"], limits: { dailyRequests: 5000 } };
    default:
      return defaultEntitlements;
  }
}