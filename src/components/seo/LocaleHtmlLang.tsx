'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Keeps the document language aligned with the locale encoded in the URL. */
export function LocaleHtmlLang() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname?.startsWith('/vi/') ? 'vi' : 'en';
  }, [pathname]);

  return null;
}
