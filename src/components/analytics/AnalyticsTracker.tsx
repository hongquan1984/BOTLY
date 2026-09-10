'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function trackClientEvent(
  eventType: 'page_view' | 'quiz_completed' | 'lead_submit' | string,
  details: {
    articleSlug?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname;
  if (path.startsWith('/admin')) return;

  const userAgent = navigator.userAgent;
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  const payload = {
    event_type: eventType,
    path,
    article_slug: details.articleSlug || extractSlugFromPath(path),
    locale: details.locale || (path.startsWith('/vi') ? 'vi' : 'en'),
    referrer: document.referrer || '',
    device_type: deviceType,
    metadata: details.metadata || {}
  };

  const body = JSON.stringify(payload);

  // Send to /api/event-ping first (resistant to ad-blockers and privacy shields)
  fetch('/api/event-ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {
    // Fallback to /api/analytics/track if needed
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  });
}

function extractSlugFromPath(path: string): string | undefined {
  const match = path.match(/\/(?:guides|huong-dan)\/([^/?#]+)/);
  return match ? match[1] : undefined;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return;
    if (pathname.startsWith('/admin')) return;

    lastTrackedPath.current = pathname;

    // Track immediately without artificial timeout delays
    trackClientEvent('page_view');
  }, [pathname]);

  return null;
}
