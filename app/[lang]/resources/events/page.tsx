import { Navigation } from "@/components/navigation";
import { EventsPage } from "@/components/events-page";

export default async function EventsPageRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <main>
      <Navigation />
      <EventsPage lang={lang} />
    </main>
  );
}