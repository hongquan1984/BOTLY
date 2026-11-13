import type { Metadata } from 'next';
import { HealthCluesGameShell } from '@/components/healthclues/HealthCluesGameShell';
import { HealthCluesDashboard } from '@/components/healthclues/HealthCluesDashboard';
import { HealthCluesLocaleProvider } from '@/components/healthclues/HealthCluesLocaleProvider';

export const metadata: Metadata = {
  title: 'My Wellness Discoveries | HealthClues',
  description: 'Continue exploring reviewed wellness resources selected for your interests.',
  robots: { index: false, follow: false },
};

export default function HealthCluesDashboardPage() {
  return <HealthCluesLocaleProvider initialLocale="en"><HealthCluesGameShell current="profile"><HealthCluesDashboard /></HealthCluesGameShell></HealthCluesLocaleProvider>;
}
