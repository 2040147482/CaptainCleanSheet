// Shared types for webhook processing and subscription data
export type SubscriptionLike = {
  plan?: string;
  status?: string;
  current_period_end?: string;
  period_end?: string;
  customer?: string;
  customer_id?: string;
  id?: string;
  product?: { plan?: string } | null;
};

export type ProfileUpdates = {
  plan?: string;
  plan_expires?: string | null;
};

// Loosely typed payload structures to avoid `any` while supporting nested access
export type WebhookCustomer = string | { id?: string; email?: string } | null;
export type WebhookProduct = { plan?: string; name?: string } | null;
export type WebhookSubscription =
  | SubscriptionLike
  | string
  | {
      id?: string;
      status?: string;
      current_period_end?: string;
      current_period_end_date?: string;
      customer?: string | { id?: string };
    };
export type WebhookOrder = { customer?: string } | null;
export type WebhookObject = {
  metadata?: Record<string, unknown>;
  subscription?: WebhookSubscription;
  product?: WebhookProduct;
  customer?: WebhookCustomer;
  order?: WebhookOrder;
  status?: string;
  type?: string;
  event?: string;
  eventType?: string;
  current_period_end?: string;
  current_period_end_date?: string;
};
export type WebhookData = WebhookObject & {
  customer_id?: string;
  customer_email?: string;
  current_period_end?: string;
  plan?: string;
};
export type WebhookPayload = {
  type?: string;
  event?: string;
  eventType?: string;
  data?: WebhookData;
  object?: WebhookObject;
  // Some providers include metadata and customer at the top-level
  metadata?: Record<string, unknown>;
  customer?: WebhookCustomer;
};
export type SubscriptionRecord = {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  user_id?: string | null;
};

export type SubscriptionUpsertRecord = SubscriptionRecord;

export type InvoiceRow = {
  invoice_id: string | null;
  status: string | null;
  currency: string | null;
  amount: number | null;
  hosted_url: string | null;
  issued_at: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CreemInvoicePayload = {
  id?: string;
  customer_id?: string;
  subscription_id?: string;
  status?: string;
  currency?: string;
  total?: number;
  amount_due?: number;
  amount?: number;
  amount_paid?: number;
  hosted_url?: string;
  invoice_url?: string;
  url?: string;
  hosted_invoice_url?: string;
  issued_at?: string | number;
  created_at?: string | number;
  created?: string | number;
  paid_at?: string | number | null;
  period_start?: string | number;
  period_end?: string | number;
  lines?: { data?: Array<{ period?: { start?: string | number; end?: string | number } }> };
};