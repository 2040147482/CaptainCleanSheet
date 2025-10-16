import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCustomerTransactions, type Transaction } from "@/lib/creem";

type UsageBreakdown = Record<string, { units: number; cost_usd: number }>;

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  // end as last day of month at 23:59:59.999
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);
  return { start, end: endInclusive };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : null;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    // Resolve latest subscription for customer_id
    const { data: sub } = await admin
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", user.id)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    const customerId: string | null = sub?.customer_id ?? null;

    // Determine which month to query
    const queryDate = month ? new Date(`${month}-01T00:00:00Z`) : new Date();

    // Aggregate selected month usage
    const { start, end } = getMonthRange(queryDate);
    let breakdown: UsageBreakdown = {};
    let totalUnits = 0;
    const unitPrice = Number(process.env.USAGE_UNIT_PRICE_USD ?? "0");

    try {
      const { data: rows } = await admin
        .from("usage_events")
        .select("event_type,units,created_at")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      (rows ?? []).forEach((r: { event_type: string; units: number }) => {
        const key = r.event_type || "usage";
        const prev = breakdown[key] ?? { units: 0, cost_usd: 0 };
        prev.units += Number(r.units || 0);
        breakdown[key] = prev;
        totalUnits += Number(r.units || 0);
      });
      // compute costs
      Object.keys(breakdown).forEach((k) => {
        breakdown[k].cost_usd = +(breakdown[k].units * unitPrice).toFixed(2);
      });
    } catch {
      breakdown = {};
      totalUnits = 0;
    }

    const subtotalUSD = +(totalUnits * unitPrice).toFixed(2);

    // Fetch invoices via Creem when customerId exists; tolerate failures
    let invoices: Array<{
      id: string;
      date: string;
      description?: string | null;
      status?: string | null;
      amount?: number | null;
      currency?: string | null;
      view_url?: string | null;
    }> = [];

    if (customerId) {
      try {
        const result = await listCustomerTransactions(customerId);
        invoices = (result?.items ?? []).map((it: Transaction) => ({
          id: String(it.id ?? ""),
          date: it.created_at ? new Date(it.created_at).toISOString() : new Date().toISOString(),
          description: it.description ?? it.summary ?? null,
          status: it.status ?? null,
          amount: typeof it.amount === "number" ? it.amount : Number(it.amount ?? 0),
          currency: it.currency ?? "USD",
          view_url: it.invoice_url ?? it.url ?? null,
        }));
      } catch {
        // Fallback: no invoices
        invoices = [];
      }
    }

    // Build available months from usage_events; include current month
    const { data: monthRows } = await admin
      .from("usage_events")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const thisMonth = new Date().toISOString().slice(0, 7);
    const available_months = [...new Set([thisMonth, ...((monthRows ?? []).map((r: { created_at: string }) => r.created_at.slice(0, 7)))])];

    return NextResponse.json({
      customer_id: customerId,
      month: queryDate.toISOString().slice(0, 7),
      available_months,
      usage: {
        start: start.toISOString(),
        end: end.toISOString(),
        unit_price_usd: unitPrice,
        total_units: totalUnits,
        subtotal_usd: subtotalUSD,
        breakdown,
      },
      invoices,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}