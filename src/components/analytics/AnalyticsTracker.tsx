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

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Fail silently in client
  }
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

    // Small delay to ensure document title & referrer are stable
    const timer = setTimeout(() => {
      trackClientEvent('page_view');
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
