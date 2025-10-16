"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, FileText, ReceiptText, Settings, Sun, Moon, Monitor, Bell, Globe, Database, User, KeyRound, LogOut, Trash } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";

type TabKey = "overview" | "reports" | "billing" | "preferences" | "account";

export default function ProfilePage() {
  const [active, setActive] = useState<TabKey>("overview");
  const [patList, setPatList] = useState<Array<{ id: string; status: string; created_at?: string; last_used_at?: string; masked_key: string }>>([]);
  const [loadingPat, setLoadingPat] = useState(false);
  const [creatingPat, setCreatingPat] = useState(false);
  const [newPat, setNewPat] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
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
          success_url: new URL(`/${locale}/profile/billing`, window.location.origin).toString(),
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

  function monthLabel() {
    const key = billingData?.month || selectedMonth;
    if (!key) return "";
    const d = new Date(`${key}-01T00:00:00`);
    const fmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    return fmt.format(d);
  }

  function rangeLabel() {
    const key = billingData?.month || selectedMonth;
    const d = new Date(`${key}-01T00:00:00`);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
    return `${fmt.format(first)} - ${fmt.format(last)}`;
  }

  function monthKeyLabel(key: string) {
    const d = new Date(`${key}-01T00:00:00`);
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(d);
  }

  function recentMonths(n = 6): string[] {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
      arr.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }

  function formatUsd(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  }

  return (
    <main>
      <Navigation />
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
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">{t("overview.usageTitle")}</CardTitle>
                      <CardDescription>{t("overview.usageDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-3 h-40">
                        {[24, 40, 28, 56, 32, 48, 20].map((h, i) => (
                          <div key={i} className="w-8 rounded-t bg-gradient-to-t from-blue-500 to-purple-600" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">{t("overview.tasksTitle")}</CardTitle>
                      <CardDescription>{t("overview.tasksDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {["Q1 Sales Cleanup", "Survey Responses", "Invoice Merge"].map((task, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                            <span className="text-sm font-medium">{task}</span>
                            <Button variant="ghost" size="sm">{t("common.view")}</Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("overview.quickTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline">{t("overview.quick.generateReport")}</Button>
                      <Button variant="outline">{t("overview.quick.cleanSheet")}</Button>
                      <Button variant="outline">{t("overview.quick.export")}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {active === "reports" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("reports.title")}</CardTitle>
                    <CardDescription>{t("reports.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                          <span className="text-sm font-medium">{t("reports.itemTitle", { index: i })}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">{t("common.view")}</Button>
                            <Button variant="outline" size="sm">{t("common.export")}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {active === "billing" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {/* Billing & Invoices */}
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
                      <div className="flex">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between">
                              {monthKeyLabel(selectedMonth)}
                              <span aria-hidden>▾</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[220px]">
                            {(billingData?.available_months ?? recentMonths(6)).map((m) => (
                              <DropdownMenuItem key={m} onSelect={() => setSelectedMonth(m)}>
                                {monthKeyLabel(m)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* On-Demand Usage */}
                    <div className="rounded-lg border bg-white/60 p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{t("billing.onDemandTitle")}</div>
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
                                {[1,2,3].map((i) => (
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
                            {Object.entries(billingData?.usage?.breakdown ?? {}).map(([type, item]) => (
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
                      <div className="text-sm font-medium mb-3">{t("billing.invoicesTitle")}</div>
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
                                {[1,2].map((i) => (
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
                            {(billingData?.invoices ?? []).map((inv) => (
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
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {active === "preferences" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("preferences.title")}</CardTitle>
                    <CardDescription>{t("preferences.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Globe className="w-4 h-4" /><span className="text-sm font-medium">{t("preferences.language")}</span></div>
                        <div className="flex gap-2">
                          <Button variant={locale === "zh" ? "default" : "outline"} size="sm">中文</Button>
                          <Button variant={locale === "en" ? "default" : "outline"} size="sm">English</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /><span className="text-sm font-medium">{t("preferences.theme")}</span></div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm"><Sun className="mr-1" />{t("preferences.light")}</Button>
                          <Button variant="outline" size="sm"><Moon className="mr-1" />{t("preferences.dark")}</Button>
                          <Button variant="default" size="sm">Auto</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Bell className="w-4 h-4" /><span className="text-sm font-medium">{t("preferences.notifications")}</span></div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm">On</Button>
                          <Button variant="outline" size="sm">Off</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Database className="w-4 h-4" /><span className="text-sm font-medium">{t("preferences.storage")}</span></div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm">Local</Button>
                          <Button variant="outline" size="sm">Cloud</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {active === "account" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("account.title")}</CardTitle>
                    <CardDescription>{t("account.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /><span className="text-sm font-medium">{t("account.username")}</span></div>
                        <div className="text-sm text-gray-700">{me?.user?.email ? `${me.user.email.split("@")[0]} • ${emailMasked(me.user.email)}` : "-"}</div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><KeyRound className="w-4 h-4" /><span className="text-sm font-medium">{t("account.resetPassword")}</span></div>
                        <Button variant="outline" size="sm" onClick={() => (window.location.href = `/${locale}/auth/update-password`)}>
                          {t("account.resetPassword")}
                        </Button>
                      </div>
                      {/* PAT Management */}
                      <div className="rounded-lg border bg-white/60 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><KeyRound className="w-4 h-4" /><span className="text-sm font-medium">{t("pat.title")}</span></div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={creatingPat}
                              onClick={async () => {
                                setCreatingPat(true);
                                setNewPat(null);
                                try {
                                  const res = await fetch("/api/pat/create", { method: "POST" });
                                  const json = await res.json();
                                  if (json.key) {
                                    setNewPat(json.key);
                                    // refresh list
                                    const r = await fetch("/api/pat/list");
                                    const j = await r.json();
                                    if (j.items) setPatList(j.items);
                                  }
                                } finally {
                                  setCreatingPat(false);
                                }
                              }}
                            >
                              {creatingPat ? t("pat.creating") : t("pat.create")}
                            </Button>
                          </div>
                        </div>
                        {newPat && (
                          <div className="mt-3 p-3 rounded-lg border bg-white">
                            <div className="text-sm text-gray-700 mb-2">{t("pat.copyHint")}</div>
                            <div className="flex items-center gap-2">
                              <input className="flex-1 text-sm border rounded px-2 py-1" readOnly value={newPat} />
                              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(newPat!)}>{t("pat.copy")}</Button>
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-2">{t("pat.listTitle")}</div>
                          {loadingPat ? (
                            <div className="text-sm text-gray-600">{t("pat.loading")}</div>
                          ) : (
                            <div className="space-y-2">
                              {patList.length === 0 && (
                                <div className="text-sm text-gray-600">{t("pat.empty")}</div>
                              )}
                              {patList.map((k) => (
                                <div key={k.id} className="flex items-center justify-between p-2 rounded border bg-white">
                                  <div>
                                    <div className="text-sm">{k.masked_key}</div>
                                    <div className="text-xs text-gray-500">{t("pat.status")}: {k.status} • {t("pat.createdAt")}: {k.created_at ? new Date(k.created_at).toLocaleString() : "-"} {k.last_used_at ? `• ${t("pat.lastUsedAt")}: ${new Date(k.last_used_at).toLocaleString()}` : ""}</div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={async () => {
                                      await fetch("/api/pat/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key_id: k.id }) });
                                      const r = await fetch("/api/pat/list");
                                      const j = await r.json();
                                      if (j.items) setPatList(j.items);
                                    }}
                                  >
                                    {t("pat.revoke")}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Trash className="w-4 h-4" /><span className="text-sm font-medium">{t("account.cancelAccount")}</span></div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => alert(t("account.cancelHint"))}>
                          {t("account.cancelAccount")}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><LogOut className="w-4 h-4" /><span className="text-sm font-medium">{t("account.logout")}</span></div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white" size="sm" onClick={async () => { try { await fetch("/api/auth/sync-token", { method: "DELETE" }); } catch {} const supabase = createClient(); await supabase.auth.signOut(); window.location.href = `/${locale}`; }}>
                          {t("account.logout")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}