"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function PricingPage() {
  const t = useTranslations("pricing");

  // 定价计划数据
  const plans = [
    {
      id: "free",
      name: t("plans.free.name"),
      price: "$0",
      period: t("plans.free.period"),
      status: "active",
      description: t("plans.free.desc"),
      features: [
        { key: "webTableDetection", included: true },
        { key: "basicCleanRules", included: true },
        { key: "exportLimited", included: true },
        { key: "diagnosisSummary", included: true },
        { key: "fullSmartClean", included: false },
        { key: "aiDiagnosis", included: false },
        { key: "advancedExport", included: false },
        { key: "unlimitedRows", included: false },
        { key: "aiInsight", included: false },
        { key: "rehabReport", included: false },
        { key: "prioritySupport", included: false },
      ],
      cta: t("plans.free.cta"),
      ctaVariant: "outline" as const,
      popular: false,
    },
    {
      id: "pro",
      name: t("plans.pro.name"),
      price: "$29",
      period: t("plans.pro.period"),
      status: "active",
      description: t("plans.pro.desc"),
      features: [
        { key: "webTableDetection", included: true },
        { key: "basicCleanRules", included: true },
        { key: "exportLimited", included: true },
        { key: "diagnosisSummary", included: true },
        { key: "fullSmartClean", included: true },
        { key: "aiDiagnosis", included: true },
        { key: "advancedExport", included: true },
        { key: "unlimitedRows", included: true },
        { key: "aiInsight", included: true },
        { key: "rehabReport", included: true },
        { key: "prioritySupport", included: true },
      ],
      cta: t("plans.pro.cta"),
      ctaVariant: "default" as const,
      popular: true,
    },
    {
      id: "team",
      name: t("plans.team.name"),
      price: "$99",
      period: t("plans.team.period"),
      status: "preview",
      description: t("plans.team.desc"),
      features: [
        { key: "includesPro", included: true },
        { key: "teamCollab", included: true },
        { key: "accessControl", included: true },
        { key: "sharedSpace", included: true },
        { key: "apiIntegration", included: true },
        { key: "slaSupport", included: true },
        { key: "modelTuning", included: true },
      ],
      cta: t("plans.team.cta"),
      ctaVariant: "outline" as const,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* Pricing Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {t("headerTitle")}
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t("headerSubtitle")}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative h-full"
              >
                <Card
                  className={`relative h-full transition-all duration-300 ${
                    plan.id === "pro"
                      ? "border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 p-[2px] shadow-2xl hover:shadow-blue-500/25"
                      : plan.id === "team"
                      ? "border border-gray-300/50 bg-white/70 backdrop-blur-sm"
                      : "border border-gray-200 bg-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {/* Pro 卡片内容容器 */}
                  <div
                    className={`${
                      plan.id === "pro" ? "bg-white rounded-lg" : ""
                    } h-full flex flex-col`}
                  >
                    <CardHeader className="text-center pb-4">
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 text-sm font-semibold">
                            {t("popular")}
                          </Badge>
                        </div>
                      )}

                      {/* Preview Badge */}
                      {plan.status === "preview" && (
                        <div className="absolute -top-4 right-4">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 px-3 py-1 text-xs">
                            {t("status.preview")}
                          </Badge>
                        </div>
                      )}

                      <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-800">
                          {plan.price}
                        </span>
                        <span className="text-gray-500 ml-1">{plan.period}</span>
                      </div>
                      <p className="text-gray-500 text-sm">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      {/* Features List */}
                      <div className="space-y-3 min-h-[220px] md:min-h-[260px] flex-1">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm ${
                                feature.included ? "text-gray-700" : "text-gray-400"
                              }`}
                            >
                              {t(`features.${feature.key}`)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <div className="pt-6 pb-2 mt-auto">
                        <Button
                          variant={plan.ctaVariant}
                          className={`w-full py-3 font-semibold transition-all duration-300 ${
                            plan.ctaVariant === "default"
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                              : "border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 bg-transparent"
                          }`}
                        >
                          {plan.cta}
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="text-gray-500 text-sm mb-4">
              {t("extras.trialNote")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t("extras.noCreditCard")}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t("extras.instantActivation")}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t("extras.support247")}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600">
              © 2025 CaptainCleanSheet
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t("footer.terms")}
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t("footer.contact")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}