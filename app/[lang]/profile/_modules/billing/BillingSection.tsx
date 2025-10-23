"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { useTranslations } from "next-intl";

// 类型定义
type BillingUsageItem = { units: number; cost_usd: number };

type Invoice = {
  id: string;
  date: string;
  amount?: number;
  currency?: string;
  status?: string;
  description?: string;
  view_url?: string;
};

type BillingData = {
  month: string;
  available_months?: string[];
  usage: {
    unit_price_usd?: number;
    subtotal_usd: number;
    breakdown: Record<string, BillingUsageItem>;
  };
  invoices: Array<Invoice>;
} | null;

type MeResponse = {
  authenticated: boolean;
  user?: { id: string; email: string };
  entitlements?: {
    plan: string;
    status?: string;
    current_period_end?: string;
    features?: string[];
    limits?: Record<string, number>;
  };
};

interface BillingSectionProps {
  t: ReturnType<typeof useTranslations>;
  rangeLabel: () => string;
  handleManageBilling: () => void;
  billingLoading: boolean;
  formatUsd: (amount: number, currency?: string) => string;
  billingData: BillingData;
  loadingBillingData: boolean;
  locale: string;
  me: MeResponse | null;
  onUnsubscribeClick: () => void;
}

export default function BillingSection({
  t,
  rangeLabel,
  handleManageBilling,
  billingLoading,
  formatUsd,
  billingData,
  loadingBillingData,
  locale,
  me,
  onUnsubscribeClick,
}: BillingSectionProps) {
  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t("billing.title")}</CardTitle>
              <CardDescription>{rangeLabel()}</CardDescription>
            </div>
            <Button variant="outline" onClick={handleManageBilling} disabled={billingLoading}>
              {t("billing.manageBilling")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Subscription Plan */}
        <div className="rounded-lg border bg-white/60 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-lg font-semibold">{t("billing.subscriptionCard.title")}</div>
              <div className="text-sm text-gray-700">
                {t("billing.subscriptionCard.current")} {" "}
                <span
                  className={`font-semibold ${(me?.entitlements?.plan ?? "").toLowerCase() === "pro" ? "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent" : ""}`}
                >
                  {(me?.entitlements?.plan ?? "").toLowerCase() === "pro" ? "Pro" : (me?.entitlements?.plan ?? "-")}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {(() => {
                  const dt = me?.entitlements?.current_period_end ? new Date(me.entitlements.current_period_end) : null;
                  if (!dt) return "-";
                  const d = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(dt);
                  return t("billing.subscriptionCard.nextCharge", { date: d });
                })()}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {(me?.entitlements?.plan ?? "").toLowerCase() !== "pro" ? (
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                  onClick={handleManageBilling}
                >
                  {t("billing.subscriptionCard.switchToPro")}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleManageBilling}>
                  {t("billing.subscriptionCard.manageBilling")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* On-Demand Usage */}
        <div className="rounded-lg border bg-white/60 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{t("billing.onDemandTitle")}</div>
              <div className="text-xs text-gray-600">{rangeLabel()}</div>
            </div>
            <div className="text-2xl font-bold">{formatUsd(billingData?.usage?.subtotal_usd ?? 0)}</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left py-1 pr-3">{t("billing.columns.type")}</th>
                  <th className="text-right py-1 pr-3">{t("billing.columns.tokens")}</th>
                  <th className="text-right py-1 pr-3">{t("billing.columns.cost")}</th>
                  <th className="text-right py-1 pr-3">{t("billing.columns.qty")}</th>
                  <th className="text-right py-1">{t("billing.columns.total")}</th>
                </tr>
              </thead>
              <tbody>
                {loadingBillingData && (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={`s-${i}`} className="border-t">
                        <td className="py-2 pr-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-3 text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                        <td className="py-2 pr-3 text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                        <td className="py-2 pr-3 text-right"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                        <td className="py-2 text-right"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                      </tr>
                    ))}
                  </>
                )}
                {Object.entries(billingData?.usage?.breakdown ?? {}).map(([type, item]: [string, BillingUsageItem]) => (
                  <tr key={type} className="border-t">
                    <td className="py-1 pr-3">{type}</td>
                    <td className="py-1 pr-3 text-right">{item.units}</td>
                    <td className="py-1 pr-3 text-right">{formatUsd((billingData?.usage?.unit_price_usd ?? 0))}</td>
                    <td className="py-1 pr-3 text-right">1</td>
                    <td className="py-1 text-right">{formatUsd(item.cost_usd)}</td>
                  </tr>
                ))}
                {Object.keys(billingData?.usage?.breakdown ?? {}).length === 0 && !loadingBillingData && (
                  <tr>
                    <td className="py-2 text-gray-500" colSpan={5}>{locale === "zh" ? "暂无用量" : "No usage this month"}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="py-2 font-medium" colSpan={4}>{t("billing.subtotal")}</td>
                  <td className="py-2 text-right font-bold">{formatUsd(billingData?.usage?.subtotal_usd ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-lg border bg-white/60 p-4">
          <div className="text-lg font-semibold mb-3">{t("billing.invoicesTitle")}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left py-1 pr-3">{t("billing.columns.date")}</th>
                  <th className="text-left py-1 pr-3">{t("billing.columns.description")}</th>
                  <th className="text-left py-1 pr-3">{t("billing.columns.status")}</th>
                  <th className="text-right py-1 pr-3">{t("billing.columns.amount")}</th>
                  <th className="text-right py-1">{t("billing.columns.invoice")}</th>
                </tr>
              </thead>
              <tbody>
                {loadingBillingData && (
                  <>
                    {[1, 2].map((i) => (
                      <tr key={`inv-s-${i}`} className="border-t">
                        <td className="py-2 pr-3"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-3"><div className="h-4 w-48 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-3 text-right"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                        <td className="py-2 text-right"><div className="h-7 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                      </tr>
                    ))}
                  </>
                )}
                {(billingData?.invoices ?? []).map((inv: Invoice) => (
                  <tr key={inv.id} className="border-t">
                    <td className="py-1 pr-3">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-1 pr-3">{inv.description ?? "-"}</td>
                    <td className="py-1 pr-3">{inv.status ?? "-"}</td>
                    <td className="py-1 pr-3 text-right">{formatUsd(inv.amount ?? 0, inv.currency ?? "USD")}</td>
                    <td className="py-1 text-right">
                      {inv.view_url ? (
                        <Button variant="ghost" size="sm" onClick={() => window.open(inv.view_url!, "_blank")}>{t("common.view")}</Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={handleManageBilling}>{t("common.view")}</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(billingData?.invoices ?? []).length === 0 && !loadingBillingData && (
                  <tr>
                    <td className="py-2 text-gray-500" colSpan={5}>{t("billing.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border bg-white/60 p-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{t("billing.dangerZone.title")}</div>
              <div className="text-sm text-gray-600">{t("billing.dangerZone.hint")}</div>
            </div>
            <Button variant="destructive" onClick={onUnsubscribeClick}>{t("billing.dangerZone.unsubscribe")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}