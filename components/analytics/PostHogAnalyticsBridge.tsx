'use client';

import { useTranslation } from '@/lib/i18n';
import { PostHogProvider } from '@/components/providers/PostHogProvider';

type PostHogAnalyticsBridgeProps = {
  children: React.ReactNode;
};

export function PostHogAnalyticsBridge({ children }: PostHogAnalyticsBridgeProps) {
  const { locale } = useTranslation();
  return <PostHogProvider locale={locale}>{children}</PostHogProvider>;
}
