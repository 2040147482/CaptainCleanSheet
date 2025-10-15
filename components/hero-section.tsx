"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Chrome, Globe, Package, Code2, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("hero");
  const p = useTranslations("platform");

  const platforms = [
    { label: p("edge"), icon: Globe },
    { label: p("chrome"), icon: Chrome },
    { label: p("firefox"), icon: MessageSquare },
    { label: p("safari"), icon: Globe },
    { label: p("tm"), icon: Code2 },
    { label: p("crx"), icon: Package },
    { label: p("wechat"), icon: MessageSquare },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Main Title */}
            <motion.h1
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t("title.line1")}
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t("title.highlight")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-gray-600 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t("subtitle")}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:from-blue-600 hover:to-purple-700"
                >
                  {t("install")}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 text-lg hover:border-blue-500 hover:text-blue-600 bg-transparent"
                >
                  {t("demo")}
                </Button>
              </motion.div>
            </motion.div>

            {/* Supported Platforms */}
            <motion.div
              className="space-y-3 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <span className="text-sm text-gray-500 font-medium">{t("platforms")}</span>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {platforms.map((pItem, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur border border-gray-200 shadow-sm"
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <pItem.icon className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 text-sm font-medium">{pItem.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative rounded-3xl bg-white/70 backdrop-blur border border-gray-200 shadow-xl p-6">
              <div className="h-[380px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <motion.div
                  className="text-3xl font-semibold text-blue-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2 }}
                >
                  {t("cleanComplete")}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}