import Link from "next/link";
import {
  getAcademyNodeHref,
  getAcademyNodeLabel,
  isAcademyNodePlanned,
} from "@/lib/academy/routes";

type AcademyNodeReferenceChipProps = {
  nodeId: string;
};

export default function AcademyNodeReferenceChip({ nodeId }: AcademyNodeReferenceChipProps) {
  const href = getAcademyNodeHref(nodeId);
  const label = getAcademyNodeLabel(nodeId);

  if (href) {
    return (
      <Link
        href={href}
        className="rounded border border-slate-700 px-2 py-0.5 text-xs text-cyan-300 hover:border-cyan-500"
      >
        {label}
      </Link>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-dashed border-slate-700 px-2 py-0.5 text-xs text-slate-400"
      title={isAcademyNodePlanned(nodeId) ? "Planned node (Coming Soon)" : "Unavailable node reference"}
    >
      <span>{label}</span>
      <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
        Coming Soon
      </span>
    </span>
  );
}

