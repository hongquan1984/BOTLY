import type { Metadata } from 'next';
import { InsomniaQuizFunnel } from '@/components/quiz/InsomniaQuizFunnel';

export const metadata: Metadata = {
  title: 'Night Pattern Quiz | Mindful Haven · Night Companion',
  description: 'Discover what may be keeping your mind awake and get a personalized plan for tonight.',
  alternates: { canonical: 'https://www.botly.vn/sleep-quiz' },
  openGraph: {
    title: 'Night Pattern Quiz | Mindful Haven · Night Companion',
    description: 'Discover what may be keeping your mind awake and get a personalized plan for tonight.',
    url: 'https://www.botly.vn/sleep-quiz',
    images: [{ url: '/app/soulscape-hero.jpg', width: 600, height: 600, alt: 'Soulscape Night Pattern Quiz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Night Pattern Quiz',
    description: 'Discover what may be keeping your mind awake and get a personalized plan for tonight.',
    images: ['/app/soulscape-hero.jpg'],
  },
};

export default function QuizInsomniaPage() {
  return <InsomniaQuizFunnel />;
}
