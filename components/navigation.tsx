"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");
  // Avatar dropdown removed per requirement; keep minimal actions

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const switchLocale = (target: "zh" | "en") => {
    if (!pathname) return;
    const segments = pathname.split("/");
    if (segments[1] === "zh" || segments[1] === "en") {
      segments[1] = target;
      window.location.assign(segments.join("/"));
    } else {
      window.location.assign(`/${target}${pathname}`);
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-md bg-white/70 shadow-lg" : "backdrop-blur-md bg-white/70"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "py-3" : "py-4"}`}>
          {/* Logo */}
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Link href={`/${locale}`} aria-label="Home" className="flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                CaptainCleanSheet
              </h1>
            </Link>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              {t("features")}
            </motion.a>
            <motion.a href="#demo" className="text-gray-700 hover:text-blue-600 font-medium transition-colors" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              {t("demo")}
            </motion.a>
            <motion.a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              {t("pricing")}
            </motion.a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Language Dropdown (icon only) */}
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-9 flex items-center justify-center text-gray-700 bg-transparent hover:text-blue-600 focus:outline-none"
                    aria-label={t("language", { default: "Language" })}
                  >
                    <span aria-hidden className="text-lg leading-none">
                      {locale === "zh" ? "🇨🇳" : "🇺🇸"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => switchLocale("zh")}>
                    <span className="mr-2">🇨🇳</span> 中文
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => switchLocale("en")}>
                    <span className="mr-2">🇺🇸</span> English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Link (no button frame) */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:flex">
              <Link
                href={`/${locale}/profile`}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                {t("profile")}
              </Link>
            </motion.div>

            {/* Install CTA */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
                {t("install")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}