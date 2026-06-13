import posthog from 'posthog-js';

const STORAGE_KEY = 'rawblock_anonymous_user_id';

function readOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}

export function bootstrapAnonymousIdentity(locale: string): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  const anonymousId = readOrCreateAnonymousId();
  posthog.identify(anonymousId, {
    preferred_locale: locale,
    app: 'rawblock_web',
  });
}
