"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Moon, Monitor, Bell, Globe, Database } from "lucide-react";
import type { useTranslations } from "next-intl";

export default function PreferencesSection({ t, locale }: { t: ReturnType<typeof useTranslations>; locale: string }) {
  return (
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
  );
}