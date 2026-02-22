import { graphStore } from "@/lib/graph/store";
import AcademyNodeClient from "./AcademyNodeClient";

type AcademyNodePageProps = {
  params: Promise<{
    nodeId: string;
  }>;
};

export function generateStaticParams() {
  return graphStore.nodes.map((node) => ({ nodeId: node.id }));
}

export default async function AcademyNodePage({ params }: AcademyNodePageProps) {
  const { nodeId } = await params;
  return <AcademyNodeClient nodeId={nodeId} />;
}
