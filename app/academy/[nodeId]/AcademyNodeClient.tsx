"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import AcademyProgressSync from "@/components/academy/AcademyProgressSync";
import ExplorerDeepLinks from "@/components/academy/ExplorerDeepLinks";
import NodeRealDataPanel from "@/components/academy/NodeRealDataPanel";
import NodeSecurityPanel from "@/components/academy/NodeSecurityPanel";
import NodeSources from "@/components/academy/NodeSources";
import NodeStory from "@/components/academy/NodeStory";
import QuizModule from "@/components/academy/QuizModule";
import GlossaryText from "@/components/glossary/GlossaryText";
import { claimsById } from "@/data/content/claims";
import { getAcademyNodeContent } from "@/lib/content/academy";
import {
    getResearchAssumptions,
    getResearchAttacks,
    getResearchPolicyVsConsensus,
    getResearchVulnerabilities,
} from "@/lib/content/research";
import { getLocalizedNodeTypeLabel, NODE_TYPE_PRESENTATION } from "@/lib/graph/nodeTypePresentation";
import { graphStore } from "@/lib/graph/store";
import type { Edge } from "@/lib/graph/types";
import { useTranslation } from "@/lib/i18n";

const GLOSSARY_ITEMS_EN = [
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

const GLOSSARY_ITEMS_ES = [
    {
        term: "Seudonimato vs Anonimato",
        tooltip: "Los datos publicos de cadena pueden vincularse incluso sin nombres.",
        definition:
            "Bitcoin es seudonimo: las direcciones son identificadores publicos sin nombres reales integrados, pero los flujos pueden rastrearse y agruparse.",
    },
    {
        term: "Nodos vs Mineros",
        tooltip: "Validacion y produccion de bloques son roles distintos.",
        definition:
            "Los nodos aplican reglas de consenso validando bloques/transacciones. Los mineros ordenan transacciones en bloques y compiten en prueba de trabajo.",
    },
    {
        term: "Billeteras vs Llaves",
        tooltip: "El software de billetera gestiona llaves; las monedas siguen on-chain.",
        definition:
            "Las billeteras almacenan y gestionan llaves criptograficas usadas para firmar gastos. El bitcoin existe como UTXOs en el estado de la cadena.",
    },
    {
        term: "Capa Base vs Lightning",
        tooltip: "La capa de liquidacion y la capa de pagos optimizan objetivos distintos.",
        definition:
            "La capa base de Bitcoin optimiza liquidacion final y seguridad. Lightning optimiza velocidad y costo para pagos cotidianos.",
    },
];

function renderRelationLabel(edge: Edge): string {
    if (edge.type === "INTRODUCED_BY" || edge.type === "INTRODUCED_IN") {
        return "INTRODUCES";
    }
    return edge.type;
}

export default function AcademyNodeClient({ nodeId }: { nodeId: string }) {
    const { locale } = useTranslation();
    const routePrefix = locale === "es" ? "/es" : "";
    const copy = locale === "es"
        ? {
            kicker: "Nodo de Academia",
            type: "Tipo",
            difficulty: "Dificultad",
            verified: "Verificado",
            summary: "Resumen",
            deepDive: "Profundizacion",
            keyTakeaways: "Puntos Clave",
            securityNotes: "Notas de Seguridad",
            noSecurityNotes: "Todavia no hay notas de seguridad para este nodo.",
            policyVsConsensus: "Politica vs Consenso",
            consensusRules: "Reglas de Consenso",
            policyRules: "Reglas de Politica",
            securityResearchPanel: "Panel de Investigacion de Seguridad",
            claimRegistryLinks: "Enlaces del Registro de Claims",
            source: "Fuente",
            furtherReading: "Lecturas Recomendadas",
            openSource: "Abrir fuente",
            graphNeighbors: "Nodos del Grafo",
            noGraphEdges: "No hay aristas del grafo para este nodo.",
            direction: "Direccion",
            relation: "Relacion",
            node: "Nodo",
            outgoing: "Saliente",
            incoming: "Entrante",
            relatedNodes: "Nodos Relacionados",
            noRelatedNodes: "No hay nodos relacionados.",
            glossary: "Glosario",
            glossaryHint: "Pasa sobre los encabezados para tooltips rapidos y luego lee la distincion canonica.",
        }
        : {
            kicker: "Academy Node",
            type: "Type",
            difficulty: "Difficulty",
            verified: "Verified",
            summary: "Summary",
            deepDive: "Deep Dive",
            keyTakeaways: "Key Takeaways",
            securityNotes: "Security Notes",
            noSecurityNotes: "No security notes for this node yet.",
            policyVsConsensus: "Policy vs Consensus",
            consensusRules: "Consensus Rules",
            policyRules: "Policy Rules",
            securityResearchPanel: "Security Research Panel",
            claimRegistryLinks: "Claim Registry Links",
            source: "Source",
            furtherReading: "Further Reading",
            openSource: "Open source",
            graphNeighbors: "Graph Neighbors",
            noGraphEdges: "No graph edges for this node.",
            direction: "Direction",
            relation: "Relation",
            node: "Node",
            outgoing: "Outgoing",
            incoming: "Incoming",
            relatedNodes: "Related Nodes",
            noRelatedNodes: "No related nodes.",
            glossary: "Glossary",
            glossaryHint: "Hover the headers for quick tooltips, then read the short canonical distinction.",
        };
    const node = graphStore.getNode(nodeId);

    if (!node) {
        notFound();
    }

    const nodeContent = getAcademyNodeContent(nodeId, locale);
    const incoming = graphStore.getIncomingEdges(node.id);
    const outgoing = graphStore.getOutgoingEdges(node.id);
    const neighbors = graphStore.getNeighbors(node.id);
    const nodeClaims = (node.claimIds ?? [])
        .map((claimId) => claimsById[claimId])
        .filter(Boolean);

    const vulnerabilities = getResearchVulnerabilities(locale);
    const attacks = getResearchAttacks(locale);
    const assumptions = getResearchAssumptions(locale);
    const policyVsConsensus = getResearchPolicyVsConsensus(locale);

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
    const localizedNodeTypeLabel = getLocalizedNodeTypeLabel(node.type, locale);
    const glossaryItems = locale === "es" ? GLOSSARY_ITEMS_ES : GLOSSARY_ITEMS_EN;

    return (
        <main className="page-shell-lg bg-slate-950">
            <div className="page-wrap-reading">
                <div className="md:hidden">
                    <Header />
                </div>
                <header className="page-header">
                    <p className="page-kicker">{copy.kicker}</p>
                    <h1 className="page-title">{nodeContent?.title ?? node.title}</h1>
                    <p className="text-sm text-cyan-300">
                        {NODE_TYPE_PRESENTATION[node.type].icon} {localizedNodeTypeLabel}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
                            {copy.type}: {localizedNodeTypeLabel}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
                            {copy.difficulty}: {node.difficulty}/4
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs">
                            {node.id}
                        </span>
                        {nodeContent ? (
                            <span className="rounded-full border border-emerald-700 bg-emerald-950/40 px-3 py-1 text-emerald-300">
                                {copy.verified}: {nodeContent.verifiedAt}
                            </span>
                        ) : null}
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="space-y-8 lg:col-span-8">
                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <h2 className="mb-3 text-lg font-semibold">{copy.summary}</h2>
                            <GlossaryText text={nodeContent?.summary ?? node.summary} className="text-slate-300" />
                        </section>

                        {nodeContent ? <NodeStory content={nodeContent} /> : null}

                        {nodeContent ? (
                            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                                <h2 className="mb-3 text-lg font-semibold">{copy.deepDive}</h2>
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
                                <h2 className="mb-3 text-lg font-semibold">{copy.keyTakeaways}</h2>
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
                            <h2 className="mb-3 text-lg font-semibold">{copy.securityNotes}</h2>
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
                                <p className="text-sm text-slate-400">{copy.noSecurityNotes}</p>
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
                                <h2 className="mb-3 text-lg font-semibold">{copy.policyVsConsensus}</h2>
                                <p className="text-sm text-slate-300">
                                    <GlossaryText text={nodeContent.policyVsConsensusExplanation} />
                                </p>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">{copy.consensusRules}</p>
                                        <ul className="mt-2 space-y-2 text-xs text-slate-300">
                                            {nodeContent.consensusRules.map((rule) => (
                                                <li key={rule} className="flex items-start gap-2">
                                                    <span className="mt-0.5 inline-flex shrink-0 rounded border border-emerald-700 bg-emerald-900/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                                                        {locale === "es" ? "Consenso" : "Consensus"}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <GlossaryText text={rule} />
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">{copy.policyRules}</p>
                                        <ul className="mt-2 space-y-2 text-xs text-slate-300">
                                            {nodeContent.policyRules.map((rule) => (
                                                <li key={rule} className="flex items-start gap-2">
                                                    <span className="mt-0.5 inline-flex shrink-0 rounded border border-amber-700 bg-amber-900/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                                                        {locale === "es" ? "Politica" : "Policy"}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <GlossaryText text={rule} />
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {nodeContent?.caseStudies?.length ? (
                            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                                <h2 className="mb-3 text-lg font-semibold">{copy.securityResearchPanel}</h2>
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
                                <h2 className="mb-3 text-lg font-semibold">{copy.claimRegistryLinks}</h2>
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
                                                {copy.source}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        {nodeContent?.furtherReading?.length ? (
                            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                                <h2 className="mb-3 text-lg font-semibold">{copy.furtherReading}</h2>
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
                                                {copy.openSource}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <h2 className="mb-3 text-lg font-semibold">{copy.graphNeighbors}</h2>
                            {incoming.length + outgoing.length === 0 ? (
                                <p className="text-sm text-slate-400">{copy.noGraphEdges}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-slate-400">
                                            <tr className="border-b border-slate-800">
                                                <th className="px-2 py-2">{copy.direction}</th>
                                                <th className="px-2 py-2">{copy.relation}</th>
                                                <th className="px-2 py-2">{copy.node}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-200">
                                            {outgoing.map((edge) => (
                                                <tr key={`out-${edge.from}-${edge.to}-${edge.type}`} className="border-b border-slate-900">
                                                    <td className="px-2 py-2 text-slate-400">{copy.outgoing}</td>
                                                    <td className="px-2 py-2 font-mono text-xs">{renderRelationLabel(edge)}</td>
                                                    <td className="px-2 py-2">
                                                        <Link href={`${routePrefix}/academy/${edge.to}`} className="text-cyan-300 hover:underline">
                                                            {getAcademyNodeContent(edge.to, locale)?.title ?? graphStore.getNode(edge.to)?.title ?? edge.to}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                            {incoming.map((edge) => (
                                                <tr key={`in-${edge.from}-${edge.to}-${edge.type}`} className="border-b border-slate-900">
                                                    <td className="px-2 py-2 text-slate-400">{copy.incoming}</td>
                                                    <td className="px-2 py-2 font-mono text-xs">{renderRelationLabel(edge)}</td>
                                                    <td className="px-2 py-2">
                                                        <Link href={`${routePrefix}/academy/${edge.from}`} className="text-cyan-300 hover:underline">
                                                            {getAcademyNodeContent(edge.from, locale)?.title ?? graphStore.getNode(edge.from)?.title ?? edge.from}
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
                            <h2 className="mb-3 text-lg font-semibold">{copy.relatedNodes}</h2>
                            {neighbors.length === 0 ? (
                                <p className="text-sm text-slate-400">{copy.noRelatedNodes}</p>
                            ) : (
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {neighbors.map((neighbor) => (
                                        <li key={neighbor.id}>
                                            <Link
                                                href={`${routePrefix}/academy/${neighbor.id}`}
                                                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm hover:border-cyan-500 hover:text-cyan-300"
                                            >
                                                <span>{getAcademyNodeContent(neighbor.id, locale)?.title ?? neighbor.title}</span>
                                                <span className="font-mono text-xs text-slate-400">{getLocalizedNodeTypeLabel(neighbor.type, locale)}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <QuizModule nodeId={node.id} />
                    </div>

                    <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6 self-start">
                        <AcademyProgressSync nodeId={node.id} />

                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <h2 className="mb-3 text-lg font-semibold">{copy.glossary}</h2>
                            <p className="mb-4 text-xs text-slate-400">
                                {copy.glossaryHint}
                            </p>
                            <div className="space-y-3">
                                {glossaryItems.map((item) => (
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
