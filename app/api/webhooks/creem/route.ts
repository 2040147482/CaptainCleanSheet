import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/creem";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Minimal types to avoid any while reflecting used fields
type SubscriptionLike = {
  plan?: string;
  status?: string;
  current_period_end?: string;
  period_end?: string;
  customer?: string;
  customer_id?: string;
  id?: string;
  product?: { plan?: string } | null;
};

type SubscriptionUpsertRecord = {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  user_id?: string;
};

type ProfileUpdates = {
  plan?: string;
  plan_expires?: string | null;
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("creem-signature");
  const rawBody = await req.text();

  try {
    const valid = verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const type: string | undefined = payload?.type ?? payload?.event ?? payload?.data?.type;

    const admin = createAdminClient();
    const digest = crypto.createHash("sha256").update(rawBody).digest("hex");
    const eventId = payload?.id || payload?.event_id || payload?.data?.id || payload?.data?.event_id || null;
    const receivedAt = new Date().toISOString();

    // Idempotency: check webhooks_log by digest
    const { data: existing } = await admin
      .from("webhooks_log")
      .select("id")
      .eq("digest", digest)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, dedup: true });
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
      // Continue processing even if logging fails, but report
      console.warn("[creem] failed to log webhook:", logErr.message);
    }

    // Helper: resolve user_id from payload
    async function resolveUserId(): Promise<string | null> {
      const mdUserId: string | undefined = payload?.data?.metadata?.user_id ?? payload?.metadata?.user_id;
      if (mdUserId && typeof mdUserId === "string") return mdUserId;
      const email: string | undefined = payload?.data?.customer?.email ?? payload?.data?.customer_email ?? payload?.customer?.email;
      if (!email) return null;
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      return profile?.user_id ?? null;
    }

    // Helper: persist subscription changes
    async function upsertSubscription(sub: SubscriptionLike | null | undefined, userId: string | null) {
      if (!sub) return;
      const plan: string | undefined = sub?.plan ?? sub?.product?.plan ?? payload?.data?.plan;
      const status: string | undefined = sub?.status;
      const currentPeriodEnd: string | undefined = sub?.current_period_end ?? sub?.period_end;
      const customerId: string | undefined = sub?.customer ?? sub?.customer_id ?? payload?.data?.customer;
      const subscriptionId: string | undefined = sub?.id ?? payload?.data?.subscription;

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
        await admin.from("subscriptions").upsert({ ...record }, { onConflict: "subscription_id" });
      } else if (userId) {
        await admin.from("subscriptions").upsert({ ...record }, { onConflict: "user_id" });
      } else {
        // If we can't associate, at least log the subscription raw
        console.warn("[creem] unable to associate subscription to user");
      }

      // Also sync profiles.plan and plan_expires when possible
      if (userId && plan) {
        const updates: ProfileUpdates = { plan };
        if (currentPeriodEnd) updates.plan_expires = currentPeriodEnd ?? null;
        await admin.from("profiles").update(updates).eq("user_id", userId);
      }
    }

    try {
      switch (type) {
        case "checkout.completed": {
          const requestId = payload?.data?.request_id ?? payload?.request_id;
          const userId = await resolveUserId();
          const plan: string | undefined = payload?.data?.metadata?.plan ?? payload?.metadata?.plan;
          const currentPeriodEnd: string | undefined = payload?.data?.subscription?.current_period_end ?? payload?.data?.current_period_end;
          const sub: SubscriptionLike | null = payload?.data?.subscription ?? null;

          // Optionally record payments/orders table here (if exists)
          // Upsert subscription and profiles
          await upsertSubscription(sub, userId);
          if (userId && plan) {
            await admin.from("profiles").update({ plan, plan_expires: currentPeriodEnd ?? null }).eq("user_id", userId);
          }
          console.log("[creem] checkout.completed", { requestId, userId, plan });
          break;
        }
        case "subscription.created":
        case "subscription.updated":
        case "subscription.canceled": {
          const subscription: SubscriptionLike | null = (payload?.data?.subscription ?? payload?.data) ?? null;
          const userId = await resolveUserId();
          await upsertSubscription(subscription, userId);
          console.log(`[creem] ${type}`, { userId, subscriptionId: subscription?.id });
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