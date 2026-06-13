'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { getExplorerTool } from '@/lib/analytics/section';
import { track } from '@/lib/analytics/track';

type ExplorerConnectionState = {
  connected: boolean;
  source?: 'api' | 'websocket' | 'fallback';
  errorType?: string;
};

export function useExplorerDataTracking(state: ExplorerConnectionState): void {
  const pathname = usePathname();
  const tool = getExplorerTool(pathname) ?? 'unknown';
  const startedAt = useRef<number | null>(null);
  const lastConnected = useRef<boolean | null>(null);

  useEffect(() => {
    if (startedAt.current === null) {
      startedAt.current = Date.now();
      track({
        name: 'explorer_page_viewed',
        properties: { tool },
      });
    }
  }, [tool]);

  useEffect(() => {
    if (state.connected && lastConnected.current !== true) {
      lastConnected.current = true;
      track({
        name: 'explorer_data_connected',
        properties: {
          tool,
          source: state.source ?? 'api',
        },
      });
      return;
    }

    if (!state.connected && state.errorType && lastConnected.current !== false) {
      lastConnected.current = false;
      const durationMs =
        startedAt.current !== null ? Date.now() - startedAt.current : undefined;
      track({
        name: 'explorer_data_failed',
        properties: {
          tool,
          error_type: state.errorType,
          duration_ms: durationMs,
        },
      });
    }
  }, [state.connected, state.errorType, state.source, tool]);
}
