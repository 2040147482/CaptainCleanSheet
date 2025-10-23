"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
//
import type { useTranslations } from "next-intl";
import { User, KeyRound, Trash, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// 类型定义
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

type PatItem = {
  id: string;
  status: string;
  created_at?: string;
  last_used_at?: string;
  masked_key: string;
};

interface AccountSectionProps {
  t: ReturnType<typeof useTranslations>;
  me: MeResponse | null;
  locale: string;
  emailMasked: (email: string) => string;
  creatingPat: boolean;
  setCreatingPat: (v: boolean) => void;
  newPat: string | null;
  setNewPat: (v: string | null) => void;
  loadingPat: boolean;
  patList: PatItem[];
  setPatList: (list: PatItem[]) => void;
}

export default function AccountSection({
  t,
  me,
  locale,
  emailMasked,
  creatingPat,
  setCreatingPat,
  newPat,
  setNewPat,
  loadingPat,
  patList,
  setPatList,
}: AccountSectionProps) {
  // remove copied state and handler

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t("account.title")}</CardTitle>
              <CardDescription>{t("account.desc")}</CardDescription>
            </div>
          </div>
        </div>
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
                        <div className="text-xs text-gray-500">{t("pat.status")}: {k.status} | {t("pat.createdAt")}: {k.created_at ? new Date(k.created_at).toLocaleString(locale) : "-"} | {t("pat.lastUsedAt")}: {k.last_used_at ? new Date(k.last_used_at).toLocaleString(locale) : "-"}</div>
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
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              size="sm"
              onClick={async () => {
                try { await fetch("/api/auth/sync-token", { method: "DELETE" }); } catch {}
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = `/${locale}`;
              }}
            >
              {t("account.logout")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}