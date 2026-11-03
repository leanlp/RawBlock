export type AppSection =
  | 'home'
  | 'explorer'
  | 'lab'
  | 'academy'
  | 'analysis'
  | 'game'
  | 'research'
  | 'ops'
  | 'about'
  | 'other';

export function getSection(pathname: string): AppSection {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/explorer')) return 'explorer';
  if (pathname.startsWith('/lab')) return 'lab';
  if (pathname.startsWith('/academy') || pathname.startsWith('/paths')) return 'academy';
  if (pathname.startsWith('/analysis')) return 'analysis';
  if (pathname.startsWith('/game')) return 'game';
  if (pathname.startsWith('/research')) return 'research';
  if (pathname.startsWith('/ops')) return 'ops';
  if (pathname.startsWith('/about')) return 'about';
  return 'other';
}

export function getExplorerTool(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'explorer') return undefined;
  return parts[1] ?? 'index';
}
