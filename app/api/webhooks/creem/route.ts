import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/creem";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
// Minimal types moved to shared module
import { SubscriptionLike, ProfileUpdates, SubscriptionUpsertRecord, CreemInvoicePayload } from "@/lib/types";

export const runtime = "nodejs";


export async function POST(req: NextRequest) {
  const signature = req.headers.get("creem-signature");
  const rawBody = await req.text();

  try {
    const valid = verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    // Robustly resolve event type across providers: type | event | eventType | nested variants
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

    const admin = createAdminClient();
    const digest = crypto.createHash("sha256").update(rawBody).digest("hex");
    const eventId = payload?.id || payload?.event_id || payload?.data?.id || payload?.data?.event_id || null;
    const receivedAt = new Date().toISOString();

    // Enhanced idempotency pre-check: prefer event_id when available
    if (eventId) {
      const { data: existByEvent } = await admin
        .from("webhooks_log")
        .select("id")
        .eq("event_id", eventId)
        .limit(1)
        .maybeSingle();
      if (existByEvent) {
        return NextResponse.json({ ok: true, dedup: true, by: "event_id" });
      }
    }

    // Insert initial log entry
    const { error: logErr } = await admin.from("webhooks_log").insert({
      event_id: eventId,
      type,
      digest,
      payload,
      received_at: receivedAt,
      status: "received",
    });
    if (logErr) {
      const msg = (logErr as unknown as { message?: string; code?: string })?.message ?? "";
      const code = (logErr as unknown as { code?: string })?.code ?? "";
      // If unique violation (digest duplicated), treat as idempotent hit
      if (code === "23505" || /duplicate key/i.test(msg)) {
        return NextResponse.json({ ok: true, dedup: true, by: "digest" });
      }
      console.warn("[creem] failed to log webhook:", msg || logErr);
    }

    // Helper: resolve user_id from payload
    async function resolveUserId(): Promise<string | null> {
      // Prefer explicit user_id from metadata
      const mdUserId: string | undefined = payload?.data?.metadata?.user_id ?? payload?.metadata?.user_id;
      if (mdUserId && typeof mdUserId === "string") return mdUserId;

      // Fallback: try multiple email sources including metadata.email
      const emailCandidates: Array<string | undefined> = [
        payload?.data?.customer?.email,
        payload?.data?.customer_email,
        payload?.customer?.email,
        payload?.object?.customer?.email,
        payload?.data?.metadata?.email,
        payload?.metadata?.email,
        payload?.object?.metadata?.email,
      ];
      const email = emailCandidates.find((e) => typeof e === "string" && !!e?.trim());
      if (!email) return null;

      // Case-insensitive match to be robust with provider case variations
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      return profile?.user_id ?? null;
    }

    // Helper: persist subscription changes
    async function upsertSubscription(sub: SubscriptionLike | null | undefined, userId: string | null) {
      if (!sub) return;
      let plan: string | undefined =
        sub?.plan ??
        sub?.product?.plan ??
        payload?.data?.product?.plan ??
        payload?.object?.product?.plan ??
        payload?.data?.plan ??
        payload?.data?.metadata?.plan;
      // Infer plan from product name if still missing
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
        payload?.data?.subscription?.status ??
        payload?.data?.status ??
        payload?.object?.subscription?.status ??
        payload?.object?.status;
      const currentPeriodEnd: string | undefined =
        sub?.current_period_end ??
        sub?.period_end ??
        payload?.data?.subscription?.current_period_end ??
        payload?.data?.current_period_end ??
        payload?.object?.subscription?.current_period_end ??
        payload?.object?.subscription?.current_period_end_date ??
        payload?.object?.current_period_end;
      const customerId: string | undefined =
        sub?.customer ??
        sub?.customer_id ??
        (typeof payload?.data?.customer === "string" ? payload?.data?.customer : undefined) ??
        payload?.data?.customer_id ??
        payload?.data?.customer?.id ??
        (typeof payload?.object?.customer === "string" ? payload?.object?.customer : undefined) ??
        payload?.object?.customer?.id ??
        payload?.object?.order?.customer ??
        payload?.object?.subscription?.customer;
      const subscriptionId: string | undefined =
        sub?.id ??
        (typeof payload?.data?.subscription === "string" ? payload?.data?.subscription : undefined) ??
        payload?.data?.subscription?.id ??
        (typeof payload?.object?.subscription === "string" ? payload?.object?.subscription : undefined) ??
        payload?.object?.subscription?.id;

      const record: SubscriptionUpsertRecord = {
        plan: plan ?? null,
        status: status ?? null,
        current_period_end: currentPeriodEnd ?? null,
        customer_id: customerId ?? null,
        subscription_id: subscriptionId ?? null,
      };
      if (userId) record.user_id = userId;

      // Try to upsert by subscription_id or user_id
      if (subscriptionId) {
        const { error } = await admin
          .from("subscriptions")
          .upsert({ ...record, user_id: userId ?? null }, { onConflict: "subscription_id" });
        if (error) throw new Error(`subscriptions upsert by subscription_id failed: ${error.message}`);
      } else if (customerId) {
        // No subscription_id: try update by customer_id; if none, insert
        const { data: existingByCustomer } = await admin
          .from("subscriptions")
          .select("id")
          .eq("customer_id", customerId)
          .limit(1)
          .maybeSingle();
        if (existingByCustomer?.id) {
          const { error } = await admin
            .from("subscriptions")
            .update({ ...record, user_id: userId ?? null })
            .eq("id", existingByCustomer.id);
          if (error) throw new Error(`subscriptions update by customer_id failed: ${error.message}`);
        } else {
          const { error } = await admin
            .from("subscriptions")
            .insert({ ...record, user_id: userId ?? null });
          if (error) throw new Error(`subscriptions insert by customer_id failed: ${error.message}`);
        }
      } else if (userId) {
        // Fallback: update latest for user or insert new
        const { data: existingByUser } = await admin
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingByUser?.id) {
          const { error } = await admin
            .from("subscriptions")
            .update({ ...record, user_id: userId })
            .eq("id", existingByUser.id);
          if (error) throw new Error(`subscriptions update by user_id failed: ${error.message}`);
        } else {
          const { error } = await admin
            .from("subscriptions")
            .insert({ ...record, user_id: userId });
          if (error) throw new Error(`subscriptions insert by user_id failed: ${error.message}`);
        }
      } else {
        // If we can't associate, at least log the subscription raw
        console.warn("[creem] unable to associate subscription to user or subscription_id");
      }

      // Also sync profiles.plan and plan_expires when possible
      if (userId && plan) {
        const updates: ProfileUpdates = { plan };
        if (currentPeriodEnd) updates.plan_expires = currentPeriodEnd ?? null;
        const { error } = await admin
          .from("profiles")
          .update(updates)
          .eq("user_id", userId);
        if (error) throw new Error(`profiles plan sync failed: ${error.message}`);
      }
    }

    // Helper: associate customer_id with subscription/user from invoice events
    async function associateCustomerSubscription(params: {
      customer_id?: string | null;
      subscription_id?: string | null;
      user_id?: string | null;
    }) {
      const { customer_id, subscription_id, user_id } = params;
      if (!customer_id && !subscription_id && !user_id) return;

      if (subscription_id) {
        const { data: existingBySub } = await admin
          .from("subscriptions")
          .select("id")
          .eq("subscription_id", subscription_id)
          .limit(1)
          .maybeSingle();
        if (existingBySub?.id) {
          const { error } = await admin
            .from("subscriptions")
            .update({ customer_id, user_id })
            .eq("id", existingBySub.id);
          if (error) throw new Error(`subscriptions link by subscription_id failed: ${error.message}`);
          return;
        }
        const { error: insertErr } = await admin
          .from("subscriptions")
          .insert({ subscription_id, customer_id: customer_id ?? null, user_id: user_id ?? null });
        if (insertErr) throw new Error(`subscriptions insert by subscription_id failed: ${insertErr.message}`);
        return;
      }

      if (customer_id) {
        const { data: existingByCustomer } = await admin
          .from("subscriptions")
          .select("id")
          .eq("customer_id", customer_id)
          .limit(1)
          .maybeSingle();
        if (existingByCustomer?.id) {
          const { error } = await admin
            .from("subscriptions")
            .update({ user_id })
            .eq("id", existingByCustomer.id);
          if (error) throw new Error(`subscriptions link by customer_id failed: ${error.message}`);
          return;
        }

        const { error: insertErr2 } = await admin
          .from("subscriptions")
          .insert({ customer_id, user_id: user_id ?? null });
        if (insertErr2) throw new Error(`subscriptions insert by customer_id failed: ${insertErr2.message}`);
      }
    }

    try {
      switch (type) {
        case "checkout.completed": {
          const requestId = payload?.data?.request_id ?? payload?.request_id ?? payload?.object?.request_id;
          const userId = await resolveUserId();
          // Try normalize plan from various sources. If product doesn't carry plan, infer from name.
          let plan: string | undefined =
            payload?.data?.metadata?.plan ?? payload?.metadata?.plan ?? payload?.data?.product?.plan ?? payload?.object?.product?.plan;
          const productName: string | undefined = payload?.object?.product?.name ?? payload?.data?.product?.name;
          if (!plan && productName) {
            const lower = productName.toLowerCase();
            if (lower.includes("team")) plan = "team";
            else if (lower.includes("pro")) plan = "pro";
          }
          const currentPeriodEnd: string | undefined =
            payload?.data?.subscription?.current_period_end ??
            payload?.data?.current_period_end ??
            payload?.object?.subscription?.current_period_end ??
            payload?.object?.subscription?.current_period_end_date;
          const sub: SubscriptionLike | null = (payload?.data?.subscription ?? payload?.object?.subscription) ?? null;

          // Optionally record payments/orders table here (if exists)
          // Upsert subscription and profiles
          if (sub) {
            await upsertSubscription(sub, userId);
          } else {
            // Fallback: construct minimal record from checkout payload
            const fallback: SubscriptionLike = {
              plan,
              status: payload?.data?.status ?? payload?.object?.status,
              current_period_end: currentPeriodEnd,
              customer_id:
                payload?.data?.customer ??
                payload?.data?.customer_id ??
                payload?.data?.customer?.id ??
                (typeof payload?.object?.customer === "string" ? payload?.object?.customer : undefined) ??
                payload?.object?.customer?.id,
              id:
                (typeof payload?.data?.subscription === "string" ? payload?.data?.subscription : undefined) ??
                payload?.data?.subscription?.id ??
                (typeof payload?.object?.subscription === "string" ? payload?.object?.subscription : undefined) ??
                payload?.object?.subscription?.id,
              product: (payload?.data?.product || payload?.object?.product) ? { plan: plan } : null,
            };
            await upsertSubscription(fallback, userId);
          }
          if (userId && plan) {
            const { error } = await admin
              .from("profiles")
              .update({ plan, plan_expires: currentPeriodEnd ?? null })
              .eq("user_id", userId);
            if (error) throw new Error(`profiles plan update failed: ${error.message}`);
          }
          console.log("[creem] checkout.completed", { requestId, userId, plan });
          break;
        }
        case "order.completed": {
          // Some integrations may emit order-level completion without embedded subscription
          const userId = await resolveUserId();
          let plan: string | undefined = payload?.data?.product?.plan ?? payload?.object?.product?.plan ?? payload?.data?.metadata?.plan;
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
              payload?.data?.customer ??
              payload?.data?.customer_id ??
              payload?.data?.customer?.id ??
              (typeof payload?.object?.customer === "string" ? payload?.object?.customer : undefined) ??
              payload?.object?.customer?.id ??
              payload?.object?.order?.customer,
            id:
              (typeof payload?.data?.subscription === "string" ? payload?.data?.subscription : undefined) ??
              payload?.data?.subscription?.id ??
              (typeof payload?.object?.subscription === "string" ? payload?.object?.subscription : undefined) ??
              payload?.object?.subscription?.id,
            product: (payload?.data?.product || payload?.object?.product) ? { plan } : null,
          };
          await upsertSubscription(fallback, userId);
          if (userId && plan) {
            const { error } = await admin
              .from("profiles")
              .update({ plan })
              .eq("user_id", userId);
            if (error) throw new Error(`profiles plan update (order.completed) failed: ${error.message}`);
          }
          console.log("[creem] order.completed", { userId, plan });
          break;
        }
        case "subscription.created":
        case "subscription.updated":
        case "subscription.canceled": {
          const subscription: SubscriptionLike | null = (payload?.data?.subscription ?? payload?.object?.subscription ?? payload?.data ?? payload?.object) ?? null;
          const userId = await resolveUserId();
          await upsertSubscription(subscription, userId);
          console.log(`[creem] ${type}`, { userId, subscriptionId: subscription?.id });
          break;
        }
        case "invoice.created":
        case "invoice.payment_succeeded":
        case "invoice.payment_failed": {
          const userId = await resolveUserId();
          const invoiceObj: CreemInvoicePayload =
            (payload?.data?.invoice ??
              payload?.object?.invoice ??
              payload?.data ??
              payload?.object) as unknown as CreemInvoicePayload;

          const customerId: string | undefined =
            invoiceObj?.customer_id ??
            payload?.data?.customer_id ??
            (typeof payload?.data?.customer === "string" ? payload?.data?.customer : undefined) ??
            payload?.data?.customer?.id ??
            (typeof payload?.object?.customer === "string" ? payload?.object?.customer : undefined) ??
            payload?.object?.customer?.id;

          const subscriptionId: string | undefined =
            invoiceObj?.subscription_id ??
            (typeof payload?.data?.subscription === "string" ? payload?.data?.subscription : undefined) ??
            payload?.data?.subscription?.id ??
            (typeof payload?.object?.subscription === "string" ? payload?.object?.subscription : undefined) ??
            payload?.object?.subscription?.id;

          await associateCustomerSubscription({
            customer_id: customerId ?? null,
            subscription_id: subscriptionId ?? null,
            user_id: userId,
          });

          // Persist invoice to DB for reliability
          const toIso = (ts: unknown): string | null => {
            if (!ts) return null;
            if (typeof ts === "string") return ts;
            if (typeof ts === "number") return new Date((ts > 1e12 ? ts : ts * 1000)).toISOString();
            return null;
          };

          const invoiceId: string | undefined =
            invoiceObj?.id ?? payload?.data?.id ?? payload?.object?.id ?? payload?.invoice?.id;
          const status: string | undefined = invoiceObj?.status ?? (type === "invoice.payment_failed" ? "failed" : undefined) ?? (type === "invoice.payment_succeeded" ? "paid" : undefined);
          const currency: string | undefined = invoiceObj?.currency ?? payload?.data?.currency ?? payload?.object?.currency;
          const amount: number | undefined =
            typeof invoiceObj?.total === "number" ? invoiceObj?.total :
              typeof invoiceObj?.amount_due === "number" ? invoiceObj?.amount_due :
                typeof invoiceObj?.amount === "number" ? invoiceObj?.amount :
                  typeof invoiceObj?.amount_paid === "number" ? invoiceObj?.amount_paid : undefined;
          const hostedUrl: string | undefined =
            invoiceObj?.hosted_url ?? invoiceObj?.invoice_url ?? invoiceObj?.url ?? invoiceObj?.hosted_invoice_url;
          const issuedAt: string | null = toIso(invoiceObj?.issued_at ?? invoiceObj?.created_at ?? invoiceObj?.created);
          const paidAt: string | null = toIso(invoiceObj?.paid_at);
          const periodStart: string | null = toIso(invoiceObj?.period_start ?? invoiceObj?.lines?.data?.[0]?.period?.start);
          const periodEnd: string | null = toIso(invoiceObj?.period_end ?? invoiceObj?.lines?.data?.[0]?.period?.end);

          try {
            const { error } = await admin
              .from("invoices")
              .upsert(
                {
                  invoice_id: invoiceId ?? null,
                  customer_id: customerId ?? null,
                  subscription_id: subscriptionId ?? null,
                  status: status ?? null,
                  currency: currency ?? null,
                  amount: typeof amount === "number" ? Math.round(amount) : null,
                  hosted_url: hostedUrl ?? null,
                  issued_at: issuedAt,
                  paid_at: paidAt,
                  period_start: periodStart,
                  period_end: periodEnd,
                  raw: payload ?? null,
                },
                { onConflict: "invoice_id" }
              );
            if (error) throw new Error(`invoices upsert failed: ${error.message}`);
          } catch (err) {
            console.warn("[creem] invoice persistence failed", err);
          }

          console.log(`[creem] ${type}`, { userId, customerId, subscriptionId, invoiceId });
          break;
        }
        default: {
          console.log("[creem] webhook event", type, payload?.data ?? payload);
        }
      }

      // Mark log as processed
      await admin.from("webhooks_log").update({ status: "processed" }).eq("digest", digest);
    } catch (processErr) {
      const message = processErr instanceof Error ? processErr.message : String(processErr);
      await admin.from("webhooks_log").update({ status: "error", error: message }).eq("digest", digest);
      throw processErr;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}