import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type DailyLimitCheck = {
  userId: string;
  orgId?: string | null;
  units: number;
  max: number;
};

export async function checkDailyLimit({ userId, orgId, units, max }: DailyLimitCheck) {
  // Compute UTC day window
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const supabase = await createSupabaseServerClient();
  // We assume usage_events has a created_at timestamp column; if missing, fallback allow
  const { data, error } = await supabase
    .from("usage_events")
    .select("units,created_at")
    .eq(orgId ? "org_id" : "user_id", orgId ?? userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error || !data) {
    return { allowed: true, remaining: max };
  }

  const used = data.reduce((sum, row: any) => sum + (Number(row.units) || 0), 0);
  const remaining = Math.max(0, max - used);
  const allowed = units <= remaining;
  return { allowed, remaining };
}