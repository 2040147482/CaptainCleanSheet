"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, FileText, ReceiptText, Settings } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import CancelSubscriptionDialog from "./_modules/dialogs/CancelSubscriptionDialog";
import OverviewSection from "./_modules/overview/OverviewSection";
import ReportsSection from "./_modules/reports/ReportsSection";
import BillingSection from "./_modules/billing/BillingSection";
import PreferencesSection from "./_modules/preferences/PreferencesSection";
import AccountSection from "./_modules/account/AccountSection";

type TabKey = "overview" | "reports" | "billing" | "preferences" | "account";

export default function ProfilePage() {
  const [active, setActive] = useState<TabKey>("overview");
  const [patList, setPatList] = useState<Array<{ id: string; status: string; created_at?: string; last_used_at?: string; masked_key: string }>>([]);
  const [loadingPat, setLoadingPat] = useState(false);
  const [creatingPat, setCreatingPat] = useState(false);
  const [newPat, setNewPat] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelMode, setCancelMode] = useState<"at_period_end" | "immediate">("at_period_end");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations("profile");
  type MeResponse = {
    authenticated: boolean;
    user?: { id: string; email: string };
    entitlements?: { plan: string; status?: string; current_period_end?: string; features?: string[]; limits?: Record<string, number> };
  };
  const [me, setMe] = useState<MeResponse | null>(null);
  const [, setLoadingMe] = useState<boolean>(false);

  type BillingUsageItem = { units: number; cost_usd: number };
  type BillingData = {
    month: string;
    available_months?: string[];
    usage: { unit_price_usd?: number; subtotal_usd: number; breakdown: Record<string, BillingUsageItem> };
    invoices: Array<{ id: string; date: string; amount?: number; currency?: string; status?: string; description?: string; view_url?: string }>;
  } | null;
  const [billingData, setBillingData] = useState<BillingData>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loadingBillingData, setLoadingBillingData] = useState<boolean>(false);

  const emailMasked = (email: string) => {
    const [name, domain] = email.split("@");
    const masked = name.length > 2 ? name.slice(0, 2) + "***" : name[0] + "***";
    return `${masked}@${domain}`;
  };

  const initialsFromEmail = (email?: string) => {
    if (!email) return "--";
    const local = email.split("@")[0];
    const first = local.charAt(0) || "-";
    const second = local.charAt(1) || "-";
    return (first + second).toUpperCase();
  };



  const sidebarItem = (key: TabKey, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => {
        try {
          const base = `/${locale}/profile`;
          const nextPath = key === "overview" ? base : `${base}/${key}`;
          window.history.pushState({ tab: key }, "", nextPath);
        } catch {}
        setActive(key);
      }}
      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all ${
        active === key ? "bg-gradient-to-r from-blue-500/15 to-purple-600/15 border border-blue-500/30 text-blue-700" : "hover:bg-white/60"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  // Sync tab state with History API path: /:lang/profile/:tab
  useEffect(() => {
    const valid = new Set<TabKey>(["overview", "reports", "billing", "preferences", "account"]);
    const readPathOrQuery = () => {
      const href = typeof window !== "undefined" ? window.location.href : "";
      if (!href) return;
      const url = new URL(href);
      const q = url.searchParams.get("tab");
      if (q && valid.has(q as TabKey)) {
        setActive(q as TabKey);
        return;
      }
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("profile");
      const candidate = parts[idx + 1];
      if (candidate && valid.has(candidate as TabKey)) {
        setActive(candidate as TabKey);
      }
    };
    readPathOrQuery();
    const onPop = () => readPathOrQuery();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    // Load basic user profile data for Overview/Subscription cards
    const loadMe = async () => {
      setLoadingMe(true);
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const json = await res.json();
        setMe(json as MeResponse);
      } catch {
        // noop
      } finally {
        setLoadingMe(false);
      }
    };
    loadMe();

    const loadPATs = async () => {
      if (active !== "account") return;
      setLoadingPat(true);
      try {
        const res = await fetch("/api/pat/list");
        const json = await res.json();
        if (json.items) setPatList(json.items);
      } catch {
        // noop
      } finally {
        setLoadingPat(false);
      }
    };
    loadPATs();

    const loadBilling = async () => {
      if (active !== "billing") return;
      setLoadingBillingData(true);
      try {
        const res = await fetch(`/api/billing/history?month=${encodeURIComponent(selectedMonth)}`, { method: "GET" });
        const json = await res.json();
        if (res.ok) {
          setBillingData(json);
          if (typeof json?.month === "string") setSelectedMonth(json.month);
        } else {
          console.error("Failed to load billing history", json?.error);
        }
      } catch (e) {
        console.error("Load billing error", e);
      } finally {
        setLoadingBillingData(false);
      }
    };
    loadBilling();
  }, [active, selectedMonth]);

  async function handleUpgrade() {
    try {
      setUpgradeLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          lang: locale,
          customer: me?.user?.email ? { email: me.user.email } : undefined,
          metadata: { source: "profile", user_id: me?.user?.id, email: me?.user?.email, plan: "pro" },
          success_url: new URL(`/${locale}/profile/billing`, process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "创建结账会话失败");
        return;
      }
      const url = data?.checkout_url;
      if (typeof url === "string") {
        window.location.assign(url);
      } else {
        alert("返回的 checkout_url 无效");
      }
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      setBillingLoading(true);
      const res = await fetch("/api/billing/portal", { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || (locale === "zh" ? "获取账单门户链接失败" : "Failed to get billing portal link"));
        return;
      }
      const url = data?.url;
      if (typeof url === "string") {
        window.open(url, "_blank");
      } else {
        alert(locale === "zh" ? "返回的账单链接无效" : "Returned billing url is invalid");
      }
    } finally {
      setBillingLoading(false);
    }
  }

  function rangeLabel() {
    const key = billingData?.month || selectedMonth;
    const d = new Date(`${key}-01T00:00:00`);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
    return `${fmt.format(first)} - ${fmt.format(last)}`;
  }

  

  // 处理取消订阅
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelError(null);
    setCancelSuccess(null);
    
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: cancelMode })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Unknown error");
      }
      
      // 设置成功消息
      if (cancelMode === "at_period_end") {
        setCancelSuccess(t("billing.cancelDialog.successAtPeriodEnd"));
      } else {
        setCancelSuccess(t("billing.cancelDialog.success"));
        // 如果是立即取消，刷新用户信息
        const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
        const meJson = await meRes.json();
        setMe(meJson as MeResponse);
      }
      
      // 3秒后关闭对话框
      setTimeout(() => {
        setShowCancelDialog(false);
        setCancelSuccess(null);
      }, 3000);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : t("billing.cancelDialog.error"));
    } finally {
      setCancelLoading(false);
    }
  };

  function formatUsd(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  }

  return (
    <main>
      <Navigation />
      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        cancelMode={cancelMode}
        setCancelMode={setCancelMode}
        cancelLoading={cancelLoading}
        cancelSuccess={cancelSuccess}
        cancelError={cancelError}
        onConfirm={handleCancelSubscription}
        t={t}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4 shadow-sm">
            <div className="space-y-2">
              {sidebarItem("overview", t("sidebar.overview"), <BarChart3 className="w-4 h-4" />)}
              {sidebarItem("reports", t("sidebar.reports"), <FileText className="w-4 h-4" />)}
              {sidebarItem("billing", t("sidebar.billing"), <ReceiptText className="w-4 h-4" />)}
              {sidebarItem("preferences", t("sidebar.preferences"), <Settings className="w-4 h-4" />)}
              {sidebarItem("account", t("sidebar.account"), <Settings className="w-4 h-4" />)}
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="bg-white/80 backdrop-blur border-gray-200">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold shadow">{initialsFromEmail(me?.user?.email)}</div>
                    <div>
                      <div className="text-lg font-semibold">{me?.user?.email ? me.user.email.split("@")[0] : t("common.user")}</div>
                      <div className="text-sm text-gray-600">{me?.user?.email ? emailMasked(me.user.email) : "-"}</div>
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const plan = (me?.entitlements?.plan ?? "free").replace(/^\w/, (c) => c.toUpperCase());
                          const end = me?.entitlements?.current_period_end ? new Date(me.entitlements.current_period_end) : null;
                          const days = end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 3600 * 1000))) : null;
                          return `${t("card.plan")}: ${plan}` + (days !== null ? ` • ${t("card.daysRemaining", { days })}` : "");
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!["pro", "team"].includes((me?.entitlements?.plan ?? "free").toLowerCase()) && (
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white" onClick={handleUpgrade} disabled={upgradeLoading}>
                        {t("card.actions.upgrade")}
                      </Button>
                    )}
                    <Button variant="outline">{t("card.actions.export")}</Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try { await fetch("/api/auth/sync-token", { method: "DELETE" }); } catch {}
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = `/${locale}`;
                      }}
                    >
                      {t("logout.action")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Content */}
            {active === "overview" && (
              <OverviewSection t={t} />
            )}

            {active === "reports" && (
              <ReportsSection t={t} />
            )}

            {active === "billing" && (
              <BillingSection
                t={t}
                rangeLabel={rangeLabel}
                handleManageBilling={handleManageBilling}
                billingLoading={billingLoading}
                formatUsd={formatUsd}
                billingData={billingData}
                loadingBillingData={loadingBillingData}
                locale={locale}
                me={me}
                onUnsubscribeClick={() => setShowCancelDialog(true)}
              />
            )}

            {active === "preferences" && (
              <PreferencesSection t={t} locale={locale} />
            )}

            {active === "account" && (
              <AccountSection
                t={t}
                me={me}
                locale={locale}
                emailMasked={emailMasked}
                creatingPat={creatingPat}
                setCreatingPat={setCreatingPat}
                newPat={newPat ?? ""}
                setNewPat={(v) => setNewPat(v)}
                loadingPat={loadingPat}
                patList={patList}
                setPatList={setPatList}
              />
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
