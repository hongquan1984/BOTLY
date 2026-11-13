import { createHash } from "node:crypto";
import { discoveryContextIdentity } from "@/features/healthclues/onboarding-context";

/** One-way account-local context binding; never logs or exposes raw Quiz answers. */
export function wellnessContextKey(profile: unknown): string {
  return createHash("sha256").update(discoveryContextIdentity(profile)).digest("hex");
}
