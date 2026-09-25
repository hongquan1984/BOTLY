import type { Metadata } from 'next';
import { SmartAppDownloadLanding } from '@/components/app/SmartAppDownloadLanding';

export const metadata: Metadata = {
  title: 'Download Soulscape: Meditation & Emotion App',
  description: 'Smart download link for Soulscape on iOS App Store & Android Google Play Store. 432Hz sleep soundscapes, emotional check-ins, and bedtime somatic resets.',
  alternates: { canonical: 'https://www.botly.vn/tai-app' },
  openGraph: {
    title: 'Download Soulscape: Meditation & Emotion',
    description: '432Hz sleep soundscapes, emotional check-ins, and bedside somatic resets. Free on iOS & Android.',
    url: 'https://www.botly.vn/tai-app',
    images: [{ url: '/app/soulscape-hero.jpg', width: 600, height: 600, alt: 'Soulscape: Meditation & Emotion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Soulscape: Meditation & Emotion',
    description: '432Hz sleep soundscapes, emotional check-ins, and bedside somatic resets. Free on iOS & Android.',
    images: ['/app/soulscape-hero.jpg'],
  },
};

export default function TaiAppPage() {
  return <SmartAppDownloadLanding />;
}
