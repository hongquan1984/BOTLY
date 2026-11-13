'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsTrackingKey, hasHealthCluesAnalyticsConsent, isHealthCluesAnalyticsPath, sanitizeHealthCluesAnalyticsPayload, shouldTrackAnalyticsPath, syncHealthCluesAnalyticsConsentCookie } from '@/lib/healthclues-analytics-consent';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const STORAGE_KEY = 'botly_vid';
  try {
    let vid = localStorage.getItem(STORAGE_KEY);
    if (!vid) {
      const match = document.cookie.match(new RegExp('(^|; )' + STORAGE_KEY + '=([^;]+)'));
      if (match && match[2]) {
        vid = match[2];
      } else {
        vid = typeof crypto !== 'undefined' && crypto.randomUUID
          ? 'v_' + crypto.randomUUID().replace(/-/g, '')
          : 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY, vid);
      document.cookie = `${STORAGE_KEY}=${vid}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return vid;
  } catch {
    return '';
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  const SESSION_KEY = 'botly_sid';
  const LAST_ACTIVE_KEY = 'botly_last_active';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  try {
    const now = Date.now();
    const lastActive = parseInt(sessionStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid || (now - lastActive > SESSION_TIMEOUT)) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? 's_' + crypto.randomUUID().replace(/-/g, '')
        : 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    sessionStorage.setItem(LAST_ACTIVE_KEY, String(now));
    return sid;
  } catch {
    return '';
  }
}

export function trackClientEvent(
  eventType: 'page_view' | 'quiz_completed' | 'lead_submit' | string,
  details: {
    articleSlug?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === 'undefined') return;

  // 1. Never track on localhost / dev environment
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    return;
  }

  const path = window.location.pathname;
  const healthCluesPath = isHealthCluesAnalyticsPath(path);
  if (!shouldTrackAnalyticsPath(path, hasHealthCluesAnalyticsConsent())) return;
  if (healthCluesPath) syncHealthCluesAnalyticsConsentCookie();
  const safeHealthCluesPayload = healthCluesPath
    ? sanitizeHealthCluesAnalyticsPayload(eventType, path, details.metadata)
    : null;
  if (healthCluesPath && !safeHealthCluesPayload) return;

  // 2. Never track automated browser tests (Puppeteer, Playwright, CDP)
  if (navigator.webdriver) {
    return;
  }

  // 3. Exclude admin / tester devices if configured
  try {
    if (localStorage.getItem('botly_exclude_tracking') === 'true') {
      return;
    }
  } catch {
    // ignore storage access error
  }

  if (path.startsWith('/admin') || path.startsWith('/thong-ke') || path.startsWith('/thongke')) {
    try {
      localStorage.setItem('botly_exclude_tracking', 'true');
      document.cookie = 'botly_exclude_tracking=true; path=/; max-age=31536000; SameSite=Lax';
    } catch {}
    return;
  }

  const userAgent = navigator.userAgent;
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();

  const payload = {
    event_type: safeHealthCluesPayload?.eventType ?? eventType,
    path: safeHealthCluesPayload?.path ?? path,
    article_slug: healthCluesPath ? null : details.articleSlug || extractSlugFromPath(path),
    locale: details.locale || (path.startsWith('/vi') ? 'vi' : 'en'),
    referrer: healthCluesPath ? '' : document.referrer || '',
    device_type: deviceType,
    visitor_id: visitorId,
    session_id: sessionId,
    metadata: safeHealthCluesPayload?.metadata ?? details.metadata ?? {}
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
  const [consentRevision, setConsentRevision] = useState(0);

  useEffect(() => {
    const updateConsent = () => setConsentRevision(revision => revision + 1);
    window.addEventListener('botly:analytics-consent', updateConsent);
    return () => window.removeEventListener('botly:analytics-consent', updateConsent);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin')) return;
    const trackingKey = analyticsTrackingKey(pathname, hasHealthCluesAnalyticsConsent());
    if (trackingKey === lastTrackedPath.current) return;

    lastTrackedPath.current = trackingKey;

    // Track immediately without artificial timeout delays
    trackClientEvent('page_view');
  }, [pathname, consentRevision]);

  return null;
}
