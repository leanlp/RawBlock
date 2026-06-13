'use client';

import { PostHogProvider as PHProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { AnalyticsBootstrap } from '@/components/analytics/AnalyticsBootstrap';
import { trackPageContext } from '@/lib/analytics/track';

type PostHogProviderProps = {
  children: React.ReactNode;
  locale: string;
};

export function PostHogProvider({ children, locale }: PostHogProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    trackPageContext(pathname);
  }, [pathname]);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <AnalyticsBootstrap locale={locale} />
      {children}
    </PHProvider>
  );
}
