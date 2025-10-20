"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function ChangelogPage({ lang }: { lang: string }) {
  const entries = [
    {
      version: "1.4.3",
      date: "October 13, 2025",
      sections: [
        {
          title: "Patch Fixes",
          items: [
            "Resolved issues affecting SSH remote connections with high resource usage.",
            "Fix for crash models seeing processed rows after mass editing edits.",
            "Improved diagnostics for third-party extensions.",
          ],
        },
        {
          title: "New Features",
          items: [
            "Fast Context introduced from Context subpanel powered by SMP, greatly reducing surf to find relevant context in 2x faster with ~2,000 tokens per model group.",
            "Learn more on our Blog.",
          ],
        },
        {
          title: "Bug Fixes",
          items: [
            "Fixed issues with RMS compatibility.",
            "Stability improvements and minor bug fixes.",
            "Windsurf UI improvements and minor bug fixes.",
          ],
        },
      ],
    },
    {
      version: "1.4.2",
      date: "October 10, 2025",
      sections: [
        {
          title: "Patch Fixes",
          items: [
            "Fix issues with auto MCP servers not being displayed correctly in the new MCP panel.",
            "Bug fixes across the new Beta Codesnap features.",
            "Improvements when some tabs contain onboarding states.",
            "Fixes for issues across the new model control user and Appbar notebooks.",
            "General bug fixes and improvements.",
          ],
        },
      ],
    },
    {
      version: "1.4.1",
      date: "October 05, 2025",
      sections: [
        {
          title: "Bug Fixes",
          items: [
            "Improved performance across UI interactions.",
            "Minor layout polish for preview cards.",
          ],
        },
      ],
    },
  ];

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
              Windsurf Editor Changelog
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-blue-700">
              <a href="#" className="hover:underline">View docs</a>
              <a href="#" className="hover:underline">Follow us on X</a>
              <a href="#" className="hover:underline">Windsurf Net Changelog</a>
            </div>
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