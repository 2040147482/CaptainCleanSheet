import { Navigation } from "@/components/navigation";
import { PricingPage } from "@/components/pricing-page";

export default async function PricingPageRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <main>
      <Navigation />
      <PricingPage lang={lang} />
    </main>
  );
}