import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubscriptionLike, ProfileUpdates, WebhookPayload, SubscriptionRecord } from "@/lib/types";

export const runtime = "nodejs";

 

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const idParam = new URL(req.url).searchParams.get("id");
  if (!idParam) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const admin = createAdminClient();
  const { data: log, error: logErr } = await admin
    .from("webhooks_log")
    .select("id,payload")
    .eq("id", Number(idParam))
    .maybeSingle();
  if (logErr || !log) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const payload: WebhookPayload = log.payload as WebhookPayload;

  async function resolveUserId(): Promise<string | null> {
    const mdUserId: string | undefined =
      (payload?.data?.metadata?.user_id as string | undefined) ??
      (payload?.metadata?.user_id as string | undefined) ??
      (payload?.object?.metadata?.user_id as string | undefined);
    if (mdUserId && typeof mdUserId === "string") return mdUserId;
    const emailCandidates: Array<string | undefined> = [
      typeof payload?.data?.customer === "object" ? payload?.data?.customer?.email : undefined,
      payload?.data?.customer_email,
      typeof payload?.customer === "object" ? payload?.customer?.email : undefined,
      typeof payload?.object?.customer === "object" ? payload?.object?.customer?.email : undefined,
      payload?.data?.metadata?.email as string | undefined,
      payload?.metadata?.email as string | undefined,
      payload?.object?.metadata?.email as string | undefined,
    ];
    const email = emailCandidates.find((e) => typeof e === "string" && !!e?.trim());
    if (!email) return null;
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    return profile?.user_id ?? null;
  }

  async function upsertSubscription(sub: SubscriptionLike | null | undefined, userId: string | null) {
    if (!sub) return;
    let plan: string | undefined =
      sub?.plan ??
      sub?.product?.plan ??
      payload?.data?.product?.plan ??
      payload?.object?.product?.plan ??
      payload?.data?.plan ??
      (payload?.data?.metadata?.plan as string | undefined);
    if (!plan) {
      const productName: string | undefined = payload?.object?.product?.name ?? payload?.data?.product?.name;
      if (productName) {
        const lower = productName.toLowerCase();
        if (lower.includes("team")) plan = "team";
        else if (lower.includes("pro")) plan = "pro";
      }
    }
    const status: string | undefined =
      sub?.status ??
      (typeof payload?.data?.subscription === "object" ? payload?.data?.subscription?.status : undefined) ??
      payload?.data?.status ??
      (typeof payload?.object?.subscription === "object" ? payload?.object?.subscription?.status : undefined) ??
      payload?.object?.status;
    const objectSub = typeof payload?.object?.subscription === "object" && payload?.object?.subscription !== null ? payload?.object?.subscription : undefined;
    const currentPeriodEnd: string | undefined =
      sub?.current_period_end ??
      sub?.period_end ??
      (typeof payload?.data?.subscription === "object" ? payload?.data?.subscription?.current_period_end : undefined) ??
      payload?.data?.current_period_end ??
      (typeof payload?.object?.subscription === "object" ? payload?.object?.subscription?.current_period_end : undefined) ??
      (objectSub && "current_period_end_date" in objectSub && typeof (objectSub as { current_period_end_date?: unknown }).current_period_end_date === "string"
        ? (objectSub as { current_period_end_date?: string }).current_period_end_date
        : undefined) ??
      payload?.object?.current_period_end;
    const customerId: string | undefined =
      sub?.customer ??
      sub?.customer_id ??
      (typeof payload?.data?.customer === "string"
        ? payload?.data?.customer
        : typeof payload?.data?.customer === "object"
        ? payload?.data?.customer?.id
        : undefined) ??
      payload?.data?.customer_id ??
      (typeof payload?.object?.customer === "string"
        ? payload?.object?.customer
        : typeof payload?.object?.customer === "object"
        ? payload?.object?.customer?.id
        : undefined) ??
      payload?.object?.order?.customer ??
      (typeof payload?.object?.subscription === "object"
        ? typeof payload?.object?.subscription?.customer === "string"
          ? payload?.object?.subscription?.customer
          : payload?.object?.subscription?.customer?.id
        : undefined);
    const subscriptionId: string | undefined =
      sub?.id ??
      (typeof payload?.data?.subscription === "string"
        ? payload?.data?.subscription
        : typeof payload?.data?.subscription === "object"
        ? payload?.data?.subscription?.id
        : undefined) ??
      (typeof payload?.object?.subscription === "string"
        ? payload?.object?.subscription
        : typeof payload?.object?.subscription === "object"
        ? payload?.object?.subscription?.id
        : undefined);

    const record: SubscriptionRecord = {
      plan: plan ?? null,
      status: status ?? null,
      current_period_end: currentPeriodEnd ?? null,
      customer_id: customerId ?? null,
      subscription_id: subscriptionId ?? null,
    };
    if (userId) record.user_id = userId;

    if (subscriptionId) {
      const { error } = await admin.from("subscriptions").upsert({ ...record, user_id: userId ?? null }, { onConflict: "subscription_id" });
      if (error) throw new Error(`subscriptions upsert by subscription_id failed: ${error.message}`);
    } else if (customerId) {
      const { data: existingByCustomer } = await admin
        .from("subscriptions")
        .select("id")
        .eq("customer_id", customerId)
        .limit(1)
        .maybeSingle();
      if (existingByCustomer?.id) {
        const { error } = await admin.from("subscriptions").update({ ...record, user_id: userId ?? null }).eq("id", existingByCustomer.id);
        if (error) throw new Error(`subscriptions update by customer_id failed: ${error.message}`);
      } else {
        const { error } = await admin.from("subscriptions").insert({ ...record, user_id: userId ?? null });
        if (error) throw new Error(`subscriptions insert by customer_id failed: ${error.message}`);
      }
    } else if (userId) {
      const { data: existingByUser } = await admin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingByUser?.id) {
        const { error } = await admin.from("subscriptions").update({ ...record, user_id: userId }).eq("id", existingByUser.id);
        if (error) throw new Error(`subscriptions update by user_id failed: ${error.message}`);
      } else {
        const { error } = await admin.from("subscriptions").insert({ ...record, user_id: userId });
        if (error) throw new Error(`subscriptions insert by user_id failed: ${error.message}`);
      }
    }

    if (userId && plan) {
      const updates: ProfileUpdates = { plan };
      if (currentPeriodEnd) updates.plan_expires = currentPeriodEnd ?? null;
      const { error } = await admin.from("profiles").update(updates).eq("user_id", userId);
      if (error) throw new Error(`profiles plan sync failed: ${error.message}`);
    }
  }

  // Determine event type from stored payload
  const type: string | undefined =
    payload?.type ||
    payload?.event ||
    payload?.eventType ||
    payload?.data?.type ||
    payload?.data?.event ||
    payload?.data?.eventType ||
    payload?.object?.type ||
    payload?.object?.event ||
    payload?.object?.eventType;

  try {
    switch (type) {
      case "checkout.completed": {
        const userId = await resolveUserId();
        let plan: string | undefined =
          (payload?.data?.metadata?.plan as string | undefined) ??
          (payload?.metadata?.plan as string | undefined) ??
          payload?.data?.product?.plan ??
          payload?.object?.product?.plan;
        const productName: string | undefined = payload?.object?.product?.name ?? payload?.data?.product?.name;
        if (!plan && productName) {
          const lower = productName.toLowerCase();
          if (lower.includes("team")) plan = "team";
          else if (lower.includes("pro")) plan = "pro";
        }
        const objectSub2 = typeof payload?.object?.subscription === "object" && payload?.object?.subscription !== null ? payload?.object?.subscription : undefined;
        const currentPeriodEnd: string | undefined =
          (typeof payload?.data?.subscription === "object" ? payload?.data?.subscription?.current_period_end : undefined) ??
          payload?.data?.current_period_end ??
          (typeof payload?.object?.subscription === "object" ? payload?.object?.subscription?.current_period_end : undefined) ??
          (objectSub2 && "current_period_end_date" in objectSub2 && typeof (objectSub2 as { current_period_end_date?: unknown }).current_period_end_date === "string"
            ? (objectSub2 as { current_period_end_date?: string }).current_period_end_date
            : undefined);
        const subCandidate = payload?.data?.subscription ?? payload?.object?.subscription;
        const sub: SubscriptionLike | null = typeof subCandidate === "string" ? null : (subCandidate as SubscriptionLike | null);
        if (sub) {
          await upsertSubscription(sub, userId);
        } else {
          const fallback: SubscriptionLike = {
            plan,
            status: payload?.data?.status ?? payload?.object?.status,
            current_period_end: currentPeriodEnd,
            customer_id:
              (typeof payload?.data?.customer === "string"
                ? payload?.data?.customer
                : typeof payload?.data?.customer === "object"
                ? payload?.data?.customer?.id
                : undefined) ??
              payload?.data?.customer_id ??
              (typeof payload?.object?.customer === "string"
                ? payload?.object?.customer
                : typeof payload?.object?.customer === "object"
                ? payload?.object?.customer?.id
                : undefined),
            id:
              (typeof payload?.data?.subscription === "string"
                ? payload?.data?.subscription
                : typeof payload?.data?.subscription === "object"
                ? payload?.data?.subscription?.id
                : undefined) ??
              (typeof payload?.object?.subscription === "string"
                ? payload?.object?.subscription
                : typeof payload?.object?.subscription === "object"
                ? payload?.object?.subscription?.id
                : undefined),
            product: (payload?.data?.product || payload?.object?.product) ? { plan } : null,
          };
          await upsertSubscription(fallback, userId);
        }
        break;
      }
      case "order.completed": {
        const userId = await resolveUserId();
        let plan: string | undefined = payload?.data?.product?.plan ?? payload?.object?.product?.plan ?? (payload?.data?.metadata?.plan as string | undefined);
        const productName2: string | undefined = payload?.object?.product?.name ?? payload?.data?.product?.name;
        if (!plan && productName2) {
          const lower = productName2.toLowerCase();
          if (lower.includes("team")) plan = "team";
          else if (lower.includes("pro")) plan = "pro";
        }
        const fallback: SubscriptionLike = {
          plan,
          status: payload?.data?.status ?? payload?.object?.status,
          customer_id:
            (typeof payload?.data?.customer === "string"
              ? payload?.data?.customer
              : typeof payload?.data?.customer === "object"
              ? payload?.data?.customer?.id
              : undefined) ??
            payload?.data?.customer_id ??
            (typeof payload?.object?.customer === "string"
              ? payload?.object?.customer
              : typeof payload?.object?.customer === "object"
              ? payload?.object?.customer?.id
              : undefined) ??
            payload?.object?.order?.customer,
          id:
            (typeof payload?.data?.subscription === "string"
              ? payload?.data?.subscription
              : typeof payload?.data?.subscription === "object"
              ? payload?.data?.subscription?.id
              : undefined) ??
            (typeof payload?.object?.subscription === "string"
              ? payload?.object?.subscription
              : typeof payload?.object?.subscription === "object"
              ? payload?.object?.subscription?.id
              : undefined),
          product: (payload?.data?.product || payload?.object?.product) ? { plan } : null,
        };
        await upsertSubscription(fallback, userId);
        break;
      }
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled": {
        const subCandidate2 = payload?.data?.subscription ?? payload?.object?.subscription ?? null;
        const subscription: SubscriptionLike | null = typeof subCandidate2 === "string" ? null : (subCandidate2 as SubscriptionLike | null);
        const userId = await resolveUserId();
        await upsertSubscription(subscription, userId);
        break;
      }
      default: {
        // No-op
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}