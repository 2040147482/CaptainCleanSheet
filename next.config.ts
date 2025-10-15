import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Link next-intl to the root i18n config file
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
