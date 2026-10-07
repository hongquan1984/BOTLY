import type { NightPatternResult, PatternId } from './night-pattern';

export type SolutionId =
  | 'thought_dump'
  | 'calm_session'
  | 'decompression'
  | 'wind_down'
  | 'sleep_sounds'
  | 'brown_noise'
  | 'white_noise'
  | 'sleep_tracking'
  | 'meditation'
  | 'night_waking_support'
  | 'routine_support';

export type ProviderStatus = 'active' | 'pending' | 'inactive';
export type ProviderRelationship = 'owned' | 'affiliate';

export type ProviderConfig = {
  id: string;
  name: string;
  solution_types: SolutionId[];
  status: ProviderStatus;
  relationship: ProviderRelationship;
  priority: number;
  supported_geos?: string[];
  destinations: { ios?: string; android?: string };
  cta_label: string;
};

export type SolutionConfig = {
  id: SolutionId;
  title: string;
  description: string;
  duration: string;
  provider_ids?: string[];
};

export type Recommendation = SolutionConfig & {
  position: 1 | 2 | 3;
  provider: ProviderConfig | null;
  destination_url: string | null;
  can_open: boolean;
};

// Keep provider data separate from quiz questions, scoring, and pattern logic.
// Only the existing verified Soulscape store destinations are active here.
export const PROVIDERS: Record<string, ProviderConfig> = {
  soulscape: {
    id: 'soulscape',
    name: 'Soulscape',
    solution_types: ['thought_dump', 'calm_session', 'decompression', 'wind_down'],
    status: 'active',
    relationship: 'owned',
    priority: 100,
    destinations: {
      ios: 'https://apps.apple.com/vn/app/soulscape-meditation-emotion/id6769265902',
      android: 'https://play.google.com/store/apps/details?id=app.soulscape.world&pcampaignid=web_share',
    },
    cta_label: 'START WITH SOULSCAPE',
  },
  'future-journal-provider': {
    id: 'future-journal-provider',
    name: 'Journal provider',
    solution_types: ['thought_dump'],
    status: 'pending',
    relationship: 'affiliate',
    priority: 80,
    destinations: {},
    cta_label: 'CLEAR YOUR MIND',
  },
  shuteye: {
    id: 'shuteye',
    name: 'ShutEye',
    solution_types: ['sleep_tracking', 'sleep_sounds'],
    status: 'pending',
    relationship: 'affiliate',
    priority: 50,
    destinations: {},
    cta_label: 'TRACK TONIGHT',
  },
  'sleep-sounds-provider': {
    id: 'sleep-sounds-provider',
    name: 'Sleep Sounds provider',
    solution_types: ['sleep_sounds', 'brown_noise', 'white_noise'],
    status: 'pending',
    relationship: 'affiliate',
    priority: 40,
    destinations: {},
    cta_label: 'TRY SLEEP SOUNDS',
  },
};

export const SOLUTIONS: Record<SolutionId, SolutionConfig> = {
  thought_dump: { id: 'thought_dump', title: 'Clear Your Mind', description: 'A short thought dump to place open loops somewhere outside your bed.', duration: '2 min', provider_ids: ['future-journal-provider', 'soulscape'] },
  calm_session: { id: 'calm_session', title: 'Calm Session', description: 'A gentle body-based reset for bedtime tension.', duration: '5 min', provider_ids: ['soulscape'] },
  decompression: { id: 'decompression', title: 'Decompress', description: 'Create a small landing space between the day and the night.', duration: '3 min', provider_ids: ['soulscape'] },
  wind_down: { id: 'wind_down', title: 'Guided Wind-down', description: 'A simple transition from active attention toward rest.', duration: '5 min', provider_ids: ['soulscape'] },
  sleep_sounds: { id: 'sleep_sounds', title: 'Sleep Sounds', description: 'A steady soundscape to give your attention somewhere softer to land.', duration: '20 min', provider_ids: ['sleep-sounds-provider'] },
  brown_noise: { id: 'brown_noise', title: 'Brown Noise', description: 'Low, even background sound for a quieter-feeling room.', duration: '20 min', provider_ids: ['sleep-sounds-provider'] },
  white_noise: { id: 'white_noise', title: 'White Noise', description: 'Consistent background sound to soften distracting peaks.', duration: '20 min', provider_ids: ['sleep-sounds-provider'] },
  sleep_tracking: { id: 'sleep_tracking', title: 'Track Tonight', description: 'Notice timing and patterns over time without turning tonight into a test.', duration: '1 min', provider_ids: ['shuteye'] },
  meditation: { id: 'meditation', title: 'Meditation', description: 'A short practice for settling attention before sleep.', duration: '5 min', provider_ids: ['soulscape'] },
  night_waking_support: { id: 'night_waking_support', title: 'Back-to-Sleep Support', description: 'A quiet session for returning to rest after waking.', duration: '5 min' },
  routine_support: { id: 'routine_support', title: 'Routine Support', description: 'Choose one repeatable cue to make the evening easier to close.', duration: '3 min' },
};

export const PATTERN_SOLUTION_MAPPING: Record<PatternId, SolutionId[]> = {
  RACING_MIND: ['thought_dump', 'sleep_sounds', 'sleep_tracking'],
  SLEEP_ANXIETY: ['calm_session', 'sleep_sounds', 'sleep_tracking'],
  STRESS_CARRYOVER: ['decompression', 'meditation', 'sleep_tracking'],
  NIGHT_WAKING: ['sleep_tracking', 'sleep_sounds', 'night_waking_support'],
  BEDTIME_PROCRASTINATION: ['wind_down', 'routine_support', 'sleep_sounds'],
  SLEEP_RHYTHM: ['sleep_tracking', 'routine_support', 'wind_down'],
};

function hasValidDestination(provider: ProviderConfig, platform: 'ios' | 'android' | 'desktop') {
  const destination = platform === 'ios'
    ? provider.destinations.ios
    : platform === 'android'
      ? provider.destinations.android
      : provider.destinations.android || provider.destinations.ios;
  return Boolean(destination && /^https?:\/\//i.test(destination));
}

export function resolveProvider(
  solution: SolutionConfig,
  platform: 'ios' | 'android' | 'desktop',
  options: { geo?: string } = {},
  providers: Record<string, ProviderConfig> = PROVIDERS,
): ProviderConfig | null {
  return (solution.provider_ids || [])
    .map(providerId => providers[providerId])
    .filter((provider): provider is ProviderConfig => Boolean(provider))
    .filter(provider => provider.status === 'active')
    .filter(provider => provider.solution_types.includes(solution.id))
    .filter(provider => !options.geo || !provider.supported_geos || provider.supported_geos.includes(options.geo))
    .filter(provider => hasValidDestination(provider, platform))
    .sort((a, b) => b.priority - a.priority)[0] || null;
}

export function resolveDestination(provider: ProviderConfig | null, platform: 'ios' | 'android' | 'desktop'): string | null {
  if (!provider || provider.status !== 'active') return null;
  return platform === 'ios' ? provider.destinations.ios || null : platform === 'android' ? provider.destinations.android || null : provider.destinations.android || provider.destinations.ios || null;
}

export function getRecommendations(result: NightPatternResult, platform: 'ios' | 'android' | 'desktop'): Recommendation[] {
  return PATTERN_SOLUTION_MAPPING[result.primary_pattern].map((solutionId, index) => {
    const solution = SOLUTIONS[solutionId];
    const provider = resolveProvider(solution, platform);
    const destination_url = resolveDestination(provider, platform);
    return { ...solution, position: (index + 1) as 1 | 2 | 3, provider, destination_url, can_open: Boolean(destination_url) };
  });
}
