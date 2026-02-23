
import DashboardHome from "../components/DashboardHome";
import { buildPageMetadata } from "@/lib/seo";

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
});

export default function Home() {
  return <DashboardHome />;
}
