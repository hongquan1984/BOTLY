import 'server-only';
import { timingSafeEqual } from 'node:crypto';

export function isAdminRequest(request: Request) {
  const expected = process.env.EBOOK_ADMIN_TOKEN;
  if (!expected) return false;
  const supplied = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '')?.[1] || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function matchesCredential(request: Request, expected: string | undefined) {
  if (!expected) return false;
  const supplied = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '')?.[1] || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isHealthCluesReviewerRequest(request: Request) {
  return matchesCredential(request, process.env.HEALTHCLUES_REVIEWER_TOKEN);
}

export function isHealthCluesModeratorRequest(request: Request) {
  return matchesCredential(request, process.env.HEALTHCLUES_MODERATOR_TOKEN);
}
