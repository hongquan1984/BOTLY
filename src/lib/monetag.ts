const IN_PAGE_PUSH_ZONE_ID = "11810590";

export const monetagInPagePush = {
  enabled:
    process.env.NODE_ENV === "production" &&
    process.env.MONETAG_INPAGE_PUSH_ENABLED === "true",
  zoneId: IN_PAGE_PUSH_ZONE_ID,
  scriptSrc: "https://nap5k.com/tag.min.js",
} as const;
