import type { Metadata } from 'next';
import { InsomniaQuizFunnel } from '@/components/quiz/InsomniaQuizFunnel';

export const metadata: Metadata = {
  title: 'Clinical Sleep & Insomnia Assessment | Botly & Soulscape',
  description: 'Take the 2-minute clinical sleep assessment based on CBT-I and the Insomnia Severity Index. Discover your personal sleep score and natural reset plan.',
  alternates: { canonical: 'https://www.botly.vn/quiz-insomnia' },
  openGraph: {
    title: 'Clinical Sleep & Insomnia Assessment | 2-Minute Diagnostic',
    description: 'Calculate your Insomnia Severity Score (ISI) and discover your personalized CBT-I somatic sleep recovery plan.',
    url: 'https://www.botly.vn/quiz-insomnia',
    images: [{ url: '/app/soulscape-hero.jpg', width: 600, height: 600, alt: 'Sleep & Insomnia Assessment' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clinical Sleep & Insomnia Assessment',
    description: 'Calculate your Insomnia Severity Score (ISI) and discover your personalized CBT-I somatic sleep recovery plan.',
    images: ['/app/soulscape-hero.jpg'],
  },
};

export default function QuizInsomniaPage() {
  return <InsomniaQuizFunnel />;
}
