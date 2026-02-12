import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttackModelsForNode } from "@/lib/graph/attackSimulation";
import { getSecurityAssumptionsForNode } from "@/lib/graph/assumptionRegistry";
import { getValidationRulesForNode } from "@/lib/graph/policyConsensusEngine";
import { getVulnerabilitiesForNode } from "@/lib/graph/securityRegistry";
import { graphStore } from "@/lib/graph/store";

type AcademyNodePageProps = {
  params: Promise<{
    nodeId: string;
  }>;
};

function toExplorerHref(link: string): string {
  if (link.startsWith("http://") || link.startsWith("https://")) {
    return link;
  }

  return `/explorer/${link}`;
}

export function generateStaticParams() {
  return graphStore.nodes.map((node) => ({ nodeId: node.id }));
}

export default async function AcademyNodePage({ params }: AcademyNodePageProps) {
  const { nodeId } = await params;
  const node = graphStore.getNode(nodeId);

  if (!node) {
    notFound();
  }

  const incoming = graphStore.getIncomingEdges(node.id);
  const outgoing = graphStore.getOutgoingEdges(node.id);
  const neighbors = graphStore.getNeighbors(node.id);
  const relatedVulnerabilities = getVulnerabilitiesForNode(node.id);
  const relatedAttacks = getAttackModelsForNode(node.id);
  const relatedAssumptions = getSecurityAssumptionsForNode(node.id);
  const nodeRules = getValidationRulesForNode(node.id);
  const consensusRules = nodeRules.filter((rule) => rule.layer === "consensus");
  const policyRules = nodeRules.filter((rule) => rule.layer === "policy");
  const policyConsensusDistinctions = [...incoming, ...outgoing].filter(
    (edge) =>
      edge.type === "POLICY_ONLY" || edge.type === "NOT_CONSENSUS_CRITICAL",
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Academy Node</p>
          <h1 className="text-3xl font-semibold md:text-4xl">{node.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              Type: {node.type}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              Difficulty: {node.difficulty}/4
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs">
              {node.id}
            </span>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Summary</h2>
          <p className="text-slate-300">{node.summary}</p>
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Security Notes</h2>
          {!node.securityNotes || node.securityNotes.length === 0 ? (
            <p className="text-sm text-slate-400">No security notes for this node yet.</p>
          ) : (
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              {node.securityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Node Security Panel</h2>
          <div className="space-y-3">
            <details className="rounded-lg border border-slate-800 bg-slate-950/70 p-3" open>
              <summary className="cursor-pointer select-none text-sm font-medium text-cyan-300">
                Related Vulnerabilities ({relatedVulnerabilities.length})
              </summary>
              {relatedVulnerabilities.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No linked vulnerabilities.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {relatedVulnerabilities.map((vulnerability) => (
                    <li key={vulnerability.id} className="rounded border border-slate-800 p-2">
                      <p className="font-medium text-slate-100">{vulnerability.title}</p>
                      <p className="text-xs text-slate-400">
                        {vulnerability.year} · {vulnerability.severity}
                        {vulnerability.cve ? ` · ${vulnerability.cve}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </details>

            <details className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-cyan-300">
                Related Attacks ({relatedAttacks.length})
              </summary>
              {relatedAttacks.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No linked attack models.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {relatedAttacks.map((attack) => (
                    <li key={attack.id} className="rounded border border-slate-800 p-2">
                      <p className="font-medium text-slate-100">{attack.title}</p>
                      <p className="text-xs text-slate-400">
                        Layer: {attack.targetLayer} · Observed: {attack.realWorldObserved ? "Yes" : "No"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </details>

            <details className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-cyan-300">
                Related Assumptions ({relatedAssumptions.length})
              </summary>
              {relatedAssumptions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No linked security assumptions.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {relatedAssumptions.map((assumption) => (
                    <li key={assumption.id} className="rounded border border-slate-800 p-2">
                      <p className="font-medium text-slate-100">{assumption.statement}</p>
                      <p className="text-xs text-slate-400">Category: {assumption.category}</p>
                    </li>
                  ))}
                </ul>
              )}
            </details>

            <details className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <summary className="cursor-pointer select-none text-sm font-medium text-cyan-300">
                Policy vs Consensus Distinctions
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Consensus Rules</p>
                  {consensusRules.length === 0 ? (
                    <p className="text-slate-400">None linked.</p>
                  ) : (
                    <ul className="list-disc pl-5 text-slate-300">
                      {consensusRules.map((rule) => (
                        <li key={rule.id}>{rule.description}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Policy Rules</p>
                  {policyRules.length === 0 ? (
                    <p className="text-slate-400">None linked.</p>
                  ) : (
                    <ul className="list-disc pl-5 text-slate-300">
                      {policyRules.map((rule) => (
                        <li key={rule.id}>{rule.description}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Distinction Edges</p>
                  {policyConsensusDistinctions.length === 0 ? (
                    <p className="text-slate-400">No explicit policy/consensus distinction edges.</p>
                  ) : (
                    <ul className="list-disc pl-5 text-slate-300">
                      {policyConsensusDistinctions.map((edge) => (
                        <li key={`${edge.from}-${edge.to}-${edge.type}`}>
                          {edge.type}: {edge.from} → {edge.to}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Security Research Panel</h2>
          {!node.securityCaseStudies || node.securityCaseStudies.length === 0 ? (
            <p className="text-sm text-slate-400">No case studies for this node yet.</p>
          ) : (
            <div className="space-y-3">
              {node.securityCaseStudies.map((study) => (
                <details key={study.title} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-cyan-300">
                    {study.title}
                  </summary>
                  <p className="mt-3 text-sm text-slate-300">{study.description}</p>
                  {study.historicalReference ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Reference: {study.historicalReference}
                    </p>
                  ) : null}
                </details>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Explorer Deep Links</h2>
          {!node.explorerLinks || node.explorerLinks.length === 0 ? (
            <p className="text-sm text-slate-400">No explorer links available.</p>
          ) : (
            <ul className="space-y-2">
              {node.explorerLinks.map((link) => {
                const href = toExplorerHref(link);
                const external = href.startsWith("http://") || href.startsWith("https://");
                return (
                  <li key={link}>
                    <Link
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      className="inline-flex rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-500"
                    >
                      {link}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

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
      </div>
    </main>
  );
}
