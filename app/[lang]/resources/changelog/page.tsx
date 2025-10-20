import { Navigation } from "@/components/navigation";
import { ChangelogPage } from "@/components/changelog-page";

export default async function ChangelogPageRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <main>
      <Navigation />
      <ChangelogPage lang={lang} />
    </main>
  );
}