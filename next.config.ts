import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Link next-intl to the root i18n config file
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      // Rewrite subpaths of profile to the base profile page for SSR
      { source: "/:lang(zh|en)/profile/:tab", destination: "/:lang/profile" },
      // Backward compatibility for older success path
      { source: "/:lang(zh|en)/profilebilling", destination: "/:lang/profile?tab=billing" },
    ];
  },
};

export default withNextIntl(nextConfig);
