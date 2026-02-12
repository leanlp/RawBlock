import Link from "next/link";
import { notFound } from "next/navigation";
import AcademyProgressSync from "@/components/academy/AcademyProgressSync";
import ExplorerDeepLinks from "@/components/academy/ExplorerDeepLinks";
import NodeRealDataPanel from "@/components/academy/NodeRealDataPanel";
import NodeSecurityPanel from "@/components/academy/NodeSecurityPanel";
import NodeSources from "@/components/academy/NodeSources";
import NodeStory from "@/components/academy/NodeStory";
import GlossaryText from "@/components/glossary/GlossaryText";
import { claimsById } from "@/data/content/claims";
import { getAcademyNodeContent } from "@/lib/content/academy";
import {
  getResearchAssumptions,
  getResearchAttacks,
  getResearchPolicyVsConsensus,
  getResearchVulnerabilities,
} from "@/lib/content/research";
import { NODE_TYPE_PRESENTATION } from "@/lib/graph/nodeTypePresentation";
import { graphStore } from "@/lib/graph/store";

type AcademyNodePageProps = {
  params: Promise<{
    nodeId: string;
  }>;
};

export function generateStaticParams() {
  return graphStore.nodes.map((node) => ({ nodeId: node.id }));
}

const GLOSSARY_ITEMS = [
  {
    term: "Pseudonymity vs Anonymity",
    tooltip: "Public chain data can be linked even when names are absent.",
    definition:
      "Bitcoin is pseudonymous: addresses are public identifiers without built-in real names, but flows can still be traced and clustered.",
  },
  {
    term: "Nodes vs Miners",
    tooltip: "Validation and block production are different roles.",
    definition:
      "Nodes enforce consensus rules by validating blocks/transactions. Miners order transactions into blocks and compete in proof-of-work.",
  },
  {
    term: "Wallets vs Keys",
    tooltip: "Wallet software manages keys; coins remain on-chain.",
    definition:
      "Wallets store and manage cryptographic keys used to sign spends. The bitcoin itself exists as UTXOs on the blockchain state.",
  },
  {
    term: "Base Layer vs Lightning",
    tooltip: "Settlement layer and payment layer optimize different goals.",
    definition:
      "Bitcoin base layer optimizes final settlement and security. Lightning optimizes speed and cost for day-to-day payment flow.",
  },
];

export default async function AcademyNodePage({ params }: AcademyNodePageProps) {
  const { nodeId } = await params;
  const node = graphStore.getNode(nodeId);

  if (!node) {
    notFound();
  }

  const nodeContent = getAcademyNodeContent(nodeId);
  const incoming = graphStore.getIncomingEdges(node.id);
  const outgoing = graphStore.getOutgoingEdges(node.id);
  const neighbors = graphStore.getNeighbors(node.id);
  const nodeClaims = (node.claimIds ?? [])
    .map((claimId) => claimsById[claimId])
    .filter(Boolean);

  const vulnerabilities = getResearchVulnerabilities();
  const attacks = getResearchAttacks();
  const assumptions = getResearchAssumptions();
  const policyVsConsensus = getResearchPolicyVsConsensus();

  const linkedVulnerabilities = nodeContent
    ? vulnerabilities.filter((item) => nodeContent.linkedVulnerabilities.includes(item.id))
    : vulnerabilities.filter((item) => item.linkedNodeIds.includes(node.id));
  const linkedAttacks = nodeContent
    ? attacks.filter((item) => nodeContent.linkedAttacks.includes(item.id))
    : attacks.filter((item) => item.linkedNodeIds.includes(node.id));
  const linkedAssumptions = nodeContent
    ? assumptions.filter((item) => nodeContent.linkedAssumptions.includes(item.id))
    : assumptions.filter((item) => item.linkedNodeIds.includes(node.id));
  const linkedPolicyVsConsensus = policyVsConsensus.filter((item) => item.linkedNodeIds.includes(node.id));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Academy Node</p>
          <h1 className="text-3xl font-semibold md:text-4xl">{node.title}</h1>
          <p className="text-sm text-cyan-300">
            {NODE_TYPE_PRESENTATION[node.type].icon} {NODE_TYPE_PRESENTATION[node.type].label}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              Type: {NODE_TYPE_PRESENTATION[node.type].label}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              Difficulty: {node.difficulty}/4
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs">
              {node.id}
            </span>
            {nodeContent ? (
              <span className="rounded-full border border-emerald-700 bg-emerald-950/40 px-3 py-1 text-emerald-300">
                Verified: {nodeContent.verifiedAt}
              </span>
            ) : null}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-lg font-semibold">Summary</h2>
              <GlossaryText text={nodeContent?.summary ?? node.summary} className="text-slate-300" />
            </section>

            {nodeContent ? <NodeStory content={nodeContent} /> : null}

            {nodeContent ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Deep Dive</h2>
                <div className="space-y-4 text-sm text-slate-300">
                  {nodeContent.deepDive.map((section) => (
                    <div key={section.heading}>
                      <h3 className="font-medium text-cyan-300">{section.heading}</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>
                            <GlossaryText text={bullet} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {nodeContent ? <NodeRealDataPanel content={nodeContent} /> : null}

            {nodeContent ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Key Takeaways</h2>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
                  {nodeContent.keyTakeaways.map((item) => (
                    <li key={item}>
                      <GlossaryText text={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-lg font-semibold">Security Notes</h2>
              {nodeContent?.securityNotes?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-slate-300">
                  {nodeContent.securityNotes.map((note) => (
                    <li key={note}>
                      <GlossaryText text={note} />
                    </li>
                  ))}
                </ul>
              ) : node.securityNotes && node.securityNotes.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-slate-300">
                  {node.securityNotes.map((note) => (
                    <li key={note}>
                      <GlossaryText text={note} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No security notes for this node yet.</p>
              )}
            </section>

            <NodeSecurityPanel
              vulnerabilities={linkedVulnerabilities}
              attacks={linkedAttacks}
              assumptions={linkedAssumptions}
              policyConsensus={linkedPolicyVsConsensus}
            />

            {nodeContent ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Policy vs Consensus</h2>
                <p className="text-sm text-slate-300">
                  <GlossaryText text={nodeContent.policyVsConsensusExplanation} />
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Consensus Rules</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                      {nodeContent.consensusRules.map((rule) => (
                        <li key={rule}>
                          <GlossaryText text={rule} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Policy Rules</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                      {nodeContent.policyRules.map((rule) => (
                        <li key={rule}>
                          <GlossaryText text={rule} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}

            {nodeContent?.caseStudies?.length ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Security Research Panel</h2>
                <div className="space-y-3">
                  {nodeContent.caseStudies.map((study) => (
                    <article key={study.title} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <h3 className="text-sm font-medium text-cyan-300">{study.title}</h3>
                      <p className="text-xs text-slate-500">{study.year}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        <GlossaryText text={study.summary} />
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {nodeContent ? <ExplorerDeepLinks content={nodeContent} /> : null}

            {nodeContent ? <NodeSources content={nodeContent} /> : null}

            {nodeClaims.length > 0 ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Claim Registry Links</h2>
                <ul className="space-y-2 text-sm text-slate-300">
                  {nodeClaims.map((claim) => (
                    <li key={claim.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-slate-200">
                        <GlossaryText text={claim.text} />
                      </p>
                      <p className="mt-2 text-xs text-slate-400">Verified: {claim.last_verified_at}</p>
                      <Link
                        href={claim.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        Source
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {nodeContent?.furtherReading?.length ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-lg font-semibold">Further Reading</h2>
                <ul className="space-y-2 text-sm text-slate-300">
                  {nodeContent.furtherReading.map((reference) => (
                    <li key={reference.url} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-slate-200">
                        <GlossaryText text={reference.title} />
                      </p>
                      <Link
                        href={reference.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        Open source
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-lg font-semibold">Graph Neighbors</h2>
              {incoming.length + outgoing.length === 0 ? (
                <p className="text-sm text-slate-400">No graph edges for this node.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr className="border-b border-slate-800">
                        <th className="px-2 py-2">Direction</th>
                        <th className="px-2 py-2">Relation</th>
                        <th className="px-2 py-2">Node</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-200">
                      {outgoing.map((edge) => (
                        <tr key={`out-${edge.from}-${edge.to}-${edge.type}`} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-400">Outgoing</td>
                          <td className="px-2 py-2 font-mono text-xs">{edge.type}</td>
                          <td className="px-2 py-2">
                            <Link href={`/academy/${edge.to}`} className="text-cyan-300 hover:underline">
                              {graphStore.getNode(edge.to)?.title ?? edge.to}
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {incoming.map((edge) => (
                        <tr key={`in-${edge.from}-${edge.to}-${edge.type}`} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-400">Incoming</td>
                          <td className="px-2 py-2 font-mono text-xs">{edge.type}</td>
                          <td className="px-2 py-2">
                            <Link href={`/academy/${edge.from}`} className="text-cyan-300 hover:underline">
                              {graphStore.getNode(edge.from)?.title ?? edge.from}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-lg font-semibold">Related Nodes</h2>
              {neighbors.length === 0 ? (
                <p className="text-sm text-slate-400">No related nodes.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {neighbors.map((neighbor) => (
                    <li key={neighbor.id}>
                      <Link
                        href={`/academy/${neighbor.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm hover:border-cyan-500 hover:text-cyan-300"
                      >
                        <span>{neighbor.title}</span>
                        <span className="font-mono text-xs text-slate-400">{neighbor.type}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6 self-start">
            <AcademyProgressSync nodeId={node.id} />

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-lg font-semibold">Glossary</h2>
              <p className="mb-4 text-xs text-slate-400">
                Hover the headers for quick tooltips, then read the short canonical distinction.
              </p>
              <div className="space-y-3">
                {GLOSSARY_ITEMS.map((item) => (
                  <div key={item.term} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <h3 title={item.tooltip} className="text-sm font-medium text-cyan-300">
                      {item.term}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
