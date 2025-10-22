import { Navigation } from "@/components/navigation";
import { ChangelogPage } from "@/components/changelog-page";
import { getChangelog } from "@/lib/changelog";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements to our platform",
};

export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 3600; // 开发环境实时刷新，生产1小时

export default async function ChangelogPageRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const changelogData = await getChangelog();
  
  return (
    <main>
      <Navigation />
      <ChangelogPage lang={lang} changelogData={changelogData} />
    </main>
  );
}