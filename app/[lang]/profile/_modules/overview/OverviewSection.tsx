"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { useTranslations } from "next-intl";


export default function OverviewSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <>
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
    </>
  );
}