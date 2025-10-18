import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCustomerTransactions, searchTransactionsByEmail, type Transaction } from "@/lib/creem";
import type { InvoiceRow } from "@/lib/types";

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
    // Resolve latest subscription for customer_id, prefer non-null customer_id
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
    } else if (user.email) {
      try {
        const result = await searchTransactionsByEmail(user.email);
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
        invoices = [];
      }
    }

    // DB fallback: use persisted invoices when external lookup fails
    if (invoices.length === 0) {
      try {
        if (customerId) {
          const { data: rows } = await admin
            .from("invoices")
            .select("invoice_id,status,currency,amount,hosted_url,issued_at,paid_at,period_start,period_end")
            .eq("customer_id", customerId)
            .order("issued_at", { ascending: false })
            .limit(20);
          const rowsTyped = (rows ?? []) as InvoiceRow[];
          invoices = rowsTyped.map((r) => ({
            id: String(r.invoice_id ?? ""),
            date: r.issued_at ? new Date(r.issued_at).toISOString() : new Date().toISOString(),
            description: null,
            status: r.status ?? null,
            amount: typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0),
            currency: r.currency ?? "USD",
            view_url: r.hosted_url ?? null,
          }));
        } else {
          // Resolve likely invoice rows via user's subscriptions when customer_id missing
          const { data: subs } = await admin
            .from("subscriptions")
            .select("subscription_id,customer_id")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(5);
          const subsTyped = (subs ?? []) as Array<{ subscription_id: string | null; customer_id: string | null }>;
          const custIds = subsTyped.map((s) => s.customer_id).filter(Boolean);
          const subIds = subsTyped.map((s) => s.subscription_id).filter(Boolean);
          let q = admin
            .from("invoices")
            .select("invoice_id,status,currency,amount,hosted_url,issued_at,paid_at,period_start,period_end");
          if (custIds.length) q = q.in("customer_id", custIds);
          else if (subIds.length) q = q.in("subscription_id", subIds);
          else q = q.eq("invoice_id", "__none__");
          const { data: rows } = await q.order("issued_at", { ascending: false }).limit(20);
          const rowsTyped = (rows ?? []) as InvoiceRow[];
          invoices = rowsTyped.map((r) => ({
            id: String(r.invoice_id ?? ""),
            date: r.issued_at ? new Date(r.issued_at).toISOString() : new Date().toISOString(),
            description: null,
            status: r.status ?? null,
            amount: typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0),
            currency: r.currency ?? "USD",
            view_url: r.hosted_url ?? null,
          }));
        }
      } catch {
        // keep invoices empty when fallback fails
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