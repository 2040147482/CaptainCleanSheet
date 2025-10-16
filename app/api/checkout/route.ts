import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type CreateCheckoutRequest } from "@/lib/creem";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateCheckoutRequest> & { product_id?: string; lang?: string; plan?: "pro" | "team" };

    // Build allowlist from specific price IDs (monthly/team)
    const monthlyId = process.env.CREEM_PRICE_PRO_MONTHLY_ID || "";
    const teamId = process.env.CREEM_PRICE_PRO_TEAM_ID || "";
    const allowed = [monthlyId, teamId].filter(Boolean);

    // Derive product_id from plan when not provided
    let productId = body.product_id || "";
    if (!productId && body.plan) {
      if (body.plan === "pro") {
        productId = monthlyId;
        if (!productId) {
          return NextResponse.json({ error: "Server missing CREEM_PRICE_PRO_MONTHLY_ID for plan 'pro'" }, { status: 500 });
        }
      } else if (body.plan === "team") {
        productId = teamId;
        if (!productId) {
          return NextResponse.json({ error: "Server missing CREEM_PRICE_PRO_TEAM_ID for plan 'team'" }, { status: 500 });
        }
      }
    }

    if (!productId) {
      return NextResponse.json({ error: "product_id or plan is required" }, { status: 400 });
    }

    if (allowed.length > 0 && !allowed.includes(productId)) {
      return NextResponse.json({ error: "product_id not allowed" }, { status: 403 });
    }

    const requestId = body.request_id || crypto.randomUUID();
    const defaultSuccessPath = process.env.CREEM_DEFAULT_SUCCESS_PATH || "/auth/sign-up-success";
    // Determine locale: prefer explicit body.lang, fallback to Referer or current path
    const supportedLangs = ["zh", "en"] as const;
    let lang = typeof body.lang === "string" && supportedLangs.includes(body.lang as (typeof supportedLangs)[number]) ? body.lang : undefined;
    if (!lang) {
      const referer = req.headers.get("referer") || "";
      const refMatch = referer.match(/\/(zh|en)(?:\/|$)/);
      const pathMatch = req.nextUrl.pathname.match(/^\/(zh|en)(?:\/|$)/);
      lang = (refMatch?.[1] || pathMatch?.[1]) as string | undefined;
    }
    const localizedPath = lang ? `/${lang}${defaultSuccessPath}` : defaultSuccessPath;
    // Prefer explicit env site url, then proxy headers (ngrok), then local origin
    const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const forwardedOrigin = xfProto && xfHost ? `${xfProto}://${xfHost}` : undefined;
    const originBase = envOrigin || forwardedOrigin || req.nextUrl.origin;
    const successUrl = body.success_url || new URL(localizedPath, originBase).toString();

    // Ensure metadata carries user email when available
    const providedEmail = typeof body.customer?.email === "string" ? body.customer.email : undefined;
    const metadata: Record<string, unknown> = { ...(body.metadata ?? {}) };
    if (providedEmail && (metadata as Record<string, unknown>).email == null) {
      (metadata as Record<string, unknown>).email = providedEmail;
    }

    const payload: CreateCheckoutRequest = {
      request_id: requestId,
      product_id: productId,
      units: body.units,
      discount_code: body.discount_code,
      customer: body.customer,
      custom_field: body.custom_field,
      success_url: successUrl,
      metadata,
    };

    const checkout = await createCheckoutSession(payload);
    return NextResponse.json({ checkout_id: checkout.id, checkout_url: checkout.checkout_url, request_id: requestId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}