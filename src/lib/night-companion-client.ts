const TOKEN_KEY = 'mindful_haven_night_companion_token';
const SETUP_DRAFT_KEY = 'mindful_haven_night_companion_setup_draft';

export type NightCompanionSetupDraft = {
  setupStep: number;
  desiredBedtime: string;
  usualWakeTime: string;
  lastHour: string[];
  sleepDoesntCome: string;
};

export function getNightCompanionToken() { if (typeof window === 'undefined') return ''; try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } }
export function saveNightCompanionToken(token: string) {
  if (!token) return false;
  try { localStorage.setItem(TOKEN_KEY, token); return localStorage.getItem(TOKEN_KEY) === token; } catch { return false; }
}
export function clearNightCompanionToken() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* persistence may be unavailable */ } }

export function readNightCompanionSetupDraft(): NightCompanionSetupDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(SETUP_DRAFT_KEY) || 'null') as Partial<NightCompanionSetupDraft> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return { setupStep: Number.isInteger(parsed.setupStep) ? Math.max(0, Math.min(2, parsed.setupStep as number)) : 0, desiredBedtime: typeof parsed.desiredBedtime === 'string' ? parsed.desiredBedtime : '', usualWakeTime: typeof parsed.usualWakeTime === 'string' ? parsed.usualWakeTime : '', lastHour: Array.isArray(parsed.lastHour) ? parsed.lastHour.filter(item => typeof item === 'string') : [], sleepDoesntCome: typeof parsed.sleepDoesntCome === 'string' ? parsed.sleepDoesntCome : 'varies' };
  } catch { return null; }
}

export function saveNightCompanionSetupDraft(draft: NightCompanionSetupDraft) {
  try { localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft)); } catch { /* draft persistence may be unavailable */ }
}

export function clearNightCompanionSetupDraft() { try { localStorage.removeItem(SETUP_DRAFT_KEY); } catch { /* draft persistence may be unavailable */ } }

export async function createNightCompanionProfile(profile: unknown) {
  const response = await fetch('/api/night-companion/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
  if (!response.ok) throw new Error('Could not create your Night Profile.');
  const data = await response.json() as { access_token: string; profile_id: string };
  if (!data.access_token || !data.profile_id || !saveNightCompanionToken(data.access_token)) throw new Error('Your Night Profile was created, but this browser could not save the access token.');
  return data;
}

export async function readNightCompanionProfile() {
  const token = getNightCompanionToken();
  if (!token) return null;
  const response = await fetch('/api/night-companion/profile', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error('Your Night Profile could not be restored. Please retry.');
  return await response.json() as { profile_id: string; profile: unknown };
}

export async function updateNightCompanionProfile(profile: unknown) {
  const token = getNightCompanionToken();
  if (!token) throw new Error('Night Profile is not available.');
  const response = await fetch('/api/night-companion/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ profile }) });
  if (!response.ok) throw new Error('Could not save your Night Companion progress.');
}
