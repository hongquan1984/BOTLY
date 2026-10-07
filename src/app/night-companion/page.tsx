import { NightCompanionFlow } from '@/components/night-companion/NightCompanionFlow';

export const metadata = { title: 'Night Companion Beta | Soulscape', description: 'A free Night 1 wellness companion.' };

export default function NightCompanionPage() {
  return <main className="min-h-screen bg-[#080b15] px-4 py-6 text-slate-100 sm:px-6"><NightCompanionFlow /></main>;
}
