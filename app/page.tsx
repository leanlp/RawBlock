import DashboardHome from "../components/DashboardHome";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo";
import { getSeoPageContent } from "@/lib/seo/pageContent";

const seoHome = getSeoPageContent("home");

export const metadata = buildPageMetadata({
  title: "Bitcoin Explorer, Labs, and Research",
  description:
    "Explore live Bitcoin blocks, mempool, network peers, fees, and miners, then learn protocol mechanics with interactive Script, Taproot, and consensus labs.",
  path: "/",
  keywords: [
    "bitcoin explorer",
    "bitcoin mempool visualizer",
    "bitcoin network map",
    "bitcoin script lab",
    "taproot playground",
  ],
  image: "/og/home.svg",
});

export default function Home() {
  return (
    <>
      <JsonLd data={faqJsonLd(seoHome.faqs)} />
      <DashboardHome />
      <SeoContentSection pageKey="home" />
    </>
  );
}
