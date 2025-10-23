"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { useTranslations } from "next-intl";

export type CancelMode = "at_period_end" | "immediate";

export interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelMode: CancelMode;
  setCancelMode: (mode: CancelMode) => void;
  cancelLoading: boolean;
  cancelSuccess: string | null;
  cancelError: string | null;
  onConfirm: () => void;
  t: ReturnType<typeof useTranslations>;
}

export default function CancelSubscriptionDialog({
  open,
  onOpenChange,
  cancelMode,
  setCancelMode,
  cancelLoading,
  cancelSuccess,
  cancelError,
  onConfirm,
  t,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t("billing.cancelDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("billing.cancelDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className={`p-3 rounded-lg border cursor-pointer ${cancelMode === "at_period_end" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            onClick={() => setCancelMode("at_period_end")}
          >
            <div className="font-medium">{t("billing.cancelDialog.atPeriodEnd")}</div>
            <div className="text-sm text-gray-600">{t("billing.cancelDialog.atPeriodEndDesc")}</div>
          </div>

          <div
            className={`p-3 rounded-lg border cursor-pointer ${cancelMode === "immediate" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            onClick={() => setCancelMode("immediate")}
          >
            <div className="font-medium">{t("billing.cancelDialog.immediate")}</div>
            <div className="text-sm text-gray-600">{t("billing.cancelDialog.immediateDesc")}</div>
          </div>

          {cancelSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800">
              {cancelSuccess}
            </div>
          )}

          {cancelError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {cancelError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelLoading || !!cancelSuccess}
          >
            {cancelLoading ? t("common.processing") : t("billing.cancelDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}