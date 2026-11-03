import posthog from 'posthog-js';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

if (typeof window !== 'undefined' && key) {
  posthog.init(key, {
    api_host: '/ingest',
    ui_host: host,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    capture_exceptions: true,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        search: true,
        textarea: true,
      },
    },
    loaded: (client) => {
      if (process.env.NODE_ENV === 'development') {
        client.debug();
      }
    },
  });
}
