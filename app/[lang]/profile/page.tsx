"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, FileText, Upload, Settings, Sun, Moon, Monitor, Bell, Globe, Database, User, KeyRound, LogOut, Trash } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";

type TabKey = "overview" | "reports" | "subscription" | "preferences" | "account";

export default function ProfilePage() {
  const [active, setActive] = useState<TabKey>("overview");
  const locale = useLocale();
  const t = useTranslations("profile");

  // TODO: replace with real plan from user profile once backend wired
  const currentPlan = "Pro";
  const isPro = currentPlan.toLowerCase() === "pro";

  const emailMasked = (email: string) => {
    const [name, domain] = email.split("@");
    const masked = name.length > 2 ? name.slice(0, 2) + "***" : name[0] + "***";
    return `${masked}@${domain}`;
  };

  const sidebarItem = (key: TabKey, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActive(key)}
      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all ${
        active === key ? "bg-gradient-to-r from-blue-500/15 to-purple-600/15 border border-blue-500/30 text-blue-700" : "hover:bg-white/60"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

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
              {sidebarItem("subscription", t("sidebar.subscription"), <Upload className="w-4 h-4" />)}
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
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold shadow">CS</div>
                    <div>
                      <div className="text-lg font-semibold">Captain User</div>
                      <div className="text-sm text-gray-600">{emailMasked("captain@example.com")}</div>
                      <div className="text-sm text-gray-600">
                        {t("card.plan")}: Pro • {t("card.daysRemaining", { days: 12 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!isPro && (
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">{t("card.actions.upgrade")}</Button>
                    )}
                    <Button variant="outline">{t("card.actions.export")}</Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
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

            {active === "subscription" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("subscription.title")}</CardTitle>
                    <CardDescription>{t("subscription.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                      <div>
                        <div className="text-sm font-medium">{t("subscription.current")}: Pro</div>
                        <div className="text-sm text-gray-600">{t("subscription.renewal")}: 2025-11-01</div>
                      </div>
                      {!isPro && (
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">{t("subscription.upgrade")}</Button>
                      )}
                    </div>
                    <div className="mt-6">
                      <details className="rounded-lg border bg-white/60 p-3">
                        <summary className="cursor-pointer text-sm font-medium">{t("subscription.history")}</summary>
                        <div className="mt-3 space-y-2 text-sm text-gray-700">
                          <div>2025-02-01 • Pro • $9.99</div>
                          <div>2025-01-01 • Pro • $9.99</div>
                        </div>
                      </details>
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
                        <div className="text-sm text-gray-700">Captain User • {emailMasked("captain@example.com")}</div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><KeyRound className="w-4 h-4" /><span className="text-sm font-medium">{t("account.resetPassword")}</span></div>
                        <Button variant="outline" size="sm" onClick={() => (window.location.href = `/${locale}/auth/update-password`)}>
                          {t("account.resetPassword")}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><Trash className="w-4 h-4" /><span className="text-sm font-medium">{t("account.cancelAccount")}</span></div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => alert(t("account.cancelHint"))}>
                          {t("account.cancelAccount")}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center gap-2"><LogOut className="w-4 h-4" /><span className="text-sm font-medium">{t("account.logout")}</span></div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white" size="sm" onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = `/${locale}`; }}>
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