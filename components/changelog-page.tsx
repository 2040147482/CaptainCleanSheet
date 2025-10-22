"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ChangelogData } from "@/lib/changelog";

export function ChangelogPage({ 
  lang, 
  changelogData 
}: { 
  lang: string;
  changelogData: ChangelogData;
}) {
  const { entries } = changelogData;

  return (
    <div className="min-h-screen bg-white" data-lang={lang}>
      <section className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              CaptainCleanSheet Extension Changelog
            </h1>
            <hr className="mt-6 border-t border-neutral-300" />
          </motion.div>

          {/* Entries */}
          <div className="space-y-12">
            {entries.map((entry, idx) => (
              <motion.div
                key={`${entry.version}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8"
              >
                {/* Left column: version and date */}
                <div className="md:pt-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">{entry.version}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-neutral-700">{entry.date}</div>
                </div>

                {/* Right column: grouped sections */}
                <div className="space-y-10">
                  {entry.sections.map((section, sIdx) => (
                    <div key={sIdx}>
                      <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                      <ul className="mt-4 list-disc pl-6 space-y-2 text-neutral-800">
                        {section.items.map((item, iIdx) => (
                          <li key={iIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}