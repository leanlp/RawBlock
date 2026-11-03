'use client';

import { useEffect, useRef } from 'react';

import { bootstrapAnonymousIdentity } from '@/lib/analytics/identity';
import { registerSuperProperties, track } from '@/lib/analytics/track';

type AnalyticsBootstrapProps = {
  locale: string;
};

export function AnalyticsBootstrap({ locale }: AnalyticsBootstrapProps) {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    booted.current = true;

    registerSuperProperties({
      app: 'rawblock_web',
      locale,
      environment: process.env.NODE_ENV,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    });

    bootstrapAnonymousIdentity(locale);

    track({
      name: 'system_app_loaded',
      properties: {
        locale,
        is_mobile: window.matchMedia('(max-width: 768px)').matches,
      },
    });
  }, [locale]);

  return null;
}
