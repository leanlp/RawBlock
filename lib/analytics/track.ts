import posthog from 'posthog-js';

import type { AnalyticsEvent } from './events';
import { getSection } from './section';

function isEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function track(event: AnalyticsEvent): void {
  if (!isEnabled()) return;
  posthog.capture(event.name, event.properties);
}

export function trackPageContext(pathname: string): void {
  if (!isEnabled()) return;
  posthog.register({
    section: getSection(pathname),
    page_name: pathname,
  });
}

export function registerSuperProperties(properties: Record<string, string | boolean | number>): void {
  if (!isEnabled()) return;
  posthog.register(properties);
}
