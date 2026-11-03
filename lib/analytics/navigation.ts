import { track } from './track';

export function trackSidebarNavigation(destination: string): void {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  track({
    name: 'navigation_sidebar_clicked',
    properties: {
      destination,
      source_page: pathname,
    },
  });
}

export function trackMobileNavigation(destination: string): void {
  track({
    name: 'navigation_mobile_nav_used',
    properties: { destination },
  });
}

export function trackLanguageChange(fromLocale: string, toLocale: string): void {
  track({
    name: 'navigation_language_changed',
    properties: {
      from_locale: fromLocale,
      to_locale: toLocale,
    },
  });
}
