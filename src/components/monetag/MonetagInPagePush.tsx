import Script from "next/script";
import { monetagInPagePush } from "@/lib/monetag";

export function MonetagInPagePush() {
  if (!monetagInPagePush.enabled) return null;

  return (
    <Script
      id="monetag-inpage-push"
      src={monetagInPagePush.scriptSrc}
      data-zone={monetagInPagePush.zoneId}
      strategy="lazyOnload"
    />
  );
}
