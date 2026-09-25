import type { Metadata } from 'next';
import { SmartAppDownloadLanding } from '@/components/app/SmartAppDownloadLanding';

export const metadata: Metadata = {
  title: 'Download Soulscape: Meditation & Emotion App | Botly Wellness',
  description: 'Smart redirect and download page for Soulscape app on iOS App Store & Android Google Play Store.',
  alternates: { canonical: 'https://www.botly.vn/app' },
  openGraph: {
    title: 'Download Soulscape: Meditation & Emotion',
    description: '432Hz sleep sounds, emotional check-in & bedtime somatic resets. Free on iOS & Android.',
    url: 'https://www.botly.vn/app',
    images: [{ url: '/app/soulscape-hero.jpg', width: 600, height: 600, alt: 'Soulscape: Meditation & Emotion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Soulscape: Meditation & Emotion',
    description: '432Hz sleep sounds, emotional check-in & bedtime somatic resets. Free on iOS & Android.',
    images: ['/app/soulscape-hero.jpg'],
  },
};

export default function AppPage() {
  return <SmartAppDownloadLanding />;
}
