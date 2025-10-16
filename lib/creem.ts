import crypto from "crypto";

const CREEM_API_KEY = process.env.CREEM_API_KEY as string | undefined;
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET as string | undefined;

// Default to production base; allow override via env if needed
const CREEM_API_BASE = process.env.CREEM_API_BASE || "https://api.creem.io";

export type CreateCheckoutRequest = {
  request_id?: string;
  product_id: string;
  units?: number;
  discount_code?: string;
  customer?: { id?: string; email?: string };
  custom_field?: Array<{
    type: "text";
    key: string;
    label: string;
    optional?: boolean;
    text?: { max_length?: number; min_length?: number };
  }>;
  success_url?: string;
  metadata?: Record<string, unknown>;
};

export type CreateCheckoutResponse = {
  id: string;
  mode: string;
  object: string;
  status: string;
  request_id?: string;
  product?: string;
  units?: number;
  order?: {
    id: string;
    transaction?: string;
    amount?: number;
    currency?: string;
    status?: string;
    type?: string;
  };
  subscription?: string;
  customer?: string;
  checkout_url: string;
  success_url?: string;
  metadata?: Record<string, unknown>;
};

async function creemFetch<T>(path: string, init: RequestInit): Promise<T> {
  if (!CREEM_API_KEY) {
    throw new Error("CREEM_API_KEY is not configured");
  }
  const res = await fetch(`${CREEM_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CREEM_API_KEY,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Creem API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function createCheckoutSession(payload: CreateCheckoutRequest) {
  return creemFetch<CreateCheckoutResponse>("/v1/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateCustomerPortalLink(customerId: string) {
  return creemFetch<{ url: string }>("/v1/customers/billing", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId }),
  });
}

export async function upgradeSubscription(
  subscriptionId: string,
  productId: string,
  updateBehavior: "proration-charge-immediately" | "proration-charge" | "proration-none" = "proration-charge-immediately",
) {
  return creemFetch<unknown>(`/v1/subscriptions/${subscriptionId}/upgrade`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId, update_behavior: updateBehavior }),
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null | undefined) {
  if (!CREEM_WEBHOOK_SECRET) {
    throw new Error("CREEM_WEBHOOK_SECRET is not configured");
  }
  if (!signature) return false;
  const computed = crypto.createHmac("sha256", CREEM_WEBHOOK_SECRET).update(rawBody).digest("hex");
  // Constant-time compare
  const sigBuf = Buffer.from(signature);
  const compBuf = Buffer.from(computed);
  if (sigBuf.length !== compBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, compBuf);
}