import DashboardHome from "../components/DashboardHome";
import { connection } from "next/server";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import { getHeroCoreMetrics } from "@/lib/heroMetrics.server";
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

export default async function Home() {
  await connection();
  const heroMetrics = await getHeroCoreMetrics();
  return (
    <>
      <JsonLd data={faqJsonLd(seoHome.faqs)} />
      <DashboardHome heroMetrics={heroMetrics} />
      <SeoContentSection pageKey="home" />
    </>
  );
}
