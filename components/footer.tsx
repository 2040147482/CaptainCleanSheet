"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-24 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm text-gray-600"
          >
            {t('brand')}
          </motion.div>

          {/* Links */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
          >
            {[
              { label: t('links.privacy'), href: "/privacy" },
              { label: t('links.terms'), href: "/terms" },
              { label: t('links.contact'), href: "/contact" },
              { label: t('links.github'), href: "https://github.com/" },
              { label: t('links.x'), href: "https://x.com/" },
              { label: t('links.facebook'), href: "https://facebook.com/" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>
        </div>
      </div>
    </footer>
  );
}