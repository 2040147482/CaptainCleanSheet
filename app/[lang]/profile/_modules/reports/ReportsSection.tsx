"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { useTranslations } from "next-intl";

export default function ReportsSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
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
  );
}