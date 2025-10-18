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

// ---- Transactions / Invoices (best-effort client) ----
export type Transaction = {
  id: string;
  amount?: number;
  currency?: string;
  status?: string;
  description?: string;
  summary?: string;
  created_at?: string;
  invoice_url?: string;
  url?: string;
};

export async function searchTransactionsByEmail(customerEmail: string): Promise<{ items: Transaction[]; total?: number; has_more?: boolean }> {
  if (!CREEM_API_KEY) {
    throw new Error("CREEM_API_KEY is not configured");
  }
  try {
    return await creemFetch<{ items: Transaction[]; total?: number; has_more?: boolean }>("/v1/transactions/search", {
      method: "POST",
      body: JSON.stringify({ customer_email: customerEmail, page_number: 1, page_size: 50 }),
    });
  } catch {
    try {
      return await creemFetch<{ items: Transaction[]; total?: number; has_more?: boolean }>(`/v1/transactions?customer_email=${encodeURIComponent(customerEmail)}&page_size=50`, {
        method: "GET",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to search transactions: ${msg}`);
    }
  }
}
export async function listCustomerTransactions(customerId: string): Promise<{ items: Transaction[]; total?: number; has_more?: boolean }> {
  if (!CREEM_API_KEY) {
    throw new Error("CREEM_API_KEY is not configured");
  }
  // Try POST search endpoint first, then fall back to GET list
  try {
    return await creemFetch<{ items: Transaction[]; total?: number; has_more?: boolean }>("/v1/transactions/search", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId, page_number: 1, page_size: 50 }),
    });
  } catch {
    // Fallback GET
    try {
      return await creemFetch<{ items: Transaction[]; total?: number; has_more?: boolean }>(`/v1/transactions?customer_id=${encodeURIComponent(customerId)}&page_size=50`, {
        method: "GET",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to list transactions: ${msg}`);
    }
  }
}