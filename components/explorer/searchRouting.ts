export function getSearchDestination(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return `/explorer/block/${trimmed}`;
  }

  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return trimmed.startsWith("00000000") || trimmed.startsWith("0000000")
      ? `/explorer/block/${trimmed}`
      : `/explorer/decoder?query=${trimmed}`;
  }

  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]+$/.test(trimmed)) {
    return `/explorer/address/${trimmed}`;
  }

  return `/explorer/decoder?query=${trimmed}`;
}
