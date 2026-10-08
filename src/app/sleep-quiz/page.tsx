import type { Metadata } from 'next';
import { InsomniaQuizFunnel } from '@/components/quiz/InsomniaQuizFunnel';

export const metadata: Metadata = {
  title: 'Night Pattern Quiz | Mindful Haven · Night Companion',
  description: 'Discover what may be keeping your mind awake and get a personalized plan for tonight.',
  alternates: { canonical: 'https://www.botly.vn/sleep-quiz' },
};

export default function SleepQuizPage() {
  return <InsomniaQuizFunnel />;
}
