import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getDictionary } from "@/app/i18n";
import "../globals.css";

export async function generateStaticParams() {
  return [{ lang: "zh" }, { lang: "en" }];
}

export const metadata: Metadata = {
  title: "CaptainCleanSheet",
  description: "AI-powered spreadsheet cleanup and export",
};


export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const locale = lang === "zh" || lang === "en" ? (lang as "zh" | "en") : "zh";
  const messages = await getDictionary(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}