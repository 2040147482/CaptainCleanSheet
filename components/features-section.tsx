"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, BarChart3, Download } from "lucide-react";
import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const tFeatures = useTranslations("features");
  const t = useTranslations("feature");

  const features = [
    { icon: Brain, title: t("intelligentDetection.title"), description: t("intelligentDetection.desc"), gradient: "from-blue-500 to-cyan-500" },
    { icon: Sparkles, title: t("deepClean.title"), description: t("deepClean.desc"), gradient: "from-purple-500 to-pink-500" },
    { icon: BarChart3, title: t("aiInsight.title"), description: t("aiInsight.desc"), gradient: "from-green-500 to-emerald-500" },
    { icon: Download, title: t("exportReport.title"), description: t("exportReport.desc"), gradient: "from-orange-500 to-red-500" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{tFeatures("header")}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{tFeatures("subheader")}</p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="rounded-2xl bg-white/70 backdrop-blur border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}