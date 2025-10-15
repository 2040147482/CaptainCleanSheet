"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden" id="pricing">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        {/* Floating Icon */}
        <motion.div className="flex justify-center mb-8" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <motion.div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2 className="text-4xl font-bold text-gray-900 mb-4" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          {t("title.line1")}
          <span className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{t("title.highlight")}</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}>
          {t("subtitle.line1")}
          <br />
          {t("subtitle.line2")}
        </motion.p>

        {/* Primary Action */}
        <motion.div className="flex justify-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 text-lg shadow-lg hover:from-blue-600 hover:to-purple-700">
            {t("button")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div className="mt-8 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}>
          {[t("installFree"), t("noSignup"), t("readyToUse")].map((label) => (
            <span key={label} className="px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-gray-200 text-sm text-gray-700">
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}