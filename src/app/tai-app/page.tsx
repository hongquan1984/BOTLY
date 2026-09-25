import type { Metadata } from 'next';
import { SmartAppDownloadLanding } from '@/components/app/SmartAppDownloadLanding';

export const metadata: Metadata = {
  title: 'Tải Ứng Dụng Soulscape: Meditation & Emotion | Botly Wellness',
  description: 'Tự động nhận diện thiết bị và chuyển hướng tải ứng dụng Soulscape trên App Store (iOS) và Google Play (Android). Âm thanh ngủ 432Hz, thiền định và cân bằng cảm xúc.',
  alternates: { canonical: 'https://www.botly.vn/tai-app' },
  openGraph: {
    title: 'Tải Ứng Dụng Soulscape: Meditation & Emotion',
    description: 'Âm thanh ngủ 432Hz, thiền định và cân bằng cảm xúc đêm muộn. Tải miễn phí trên iOS & Android.',
    url: 'https://www.botly.vn/tai-app',
    images: [{ url: '/app/soulscape-hero.jpg', width: 600, height: 600, alt: 'Soulscape: Meditation & Emotion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tải Ứng Dụng Soulscape: Meditation & Emotion',
    description: 'Âm thanh ngủ 432Hz, thiền định và cân bằng cảm xúc đêm muộn. Tải miễn phí trên iOS & Android.',
    images: ['/app/soulscape-hero.jpg'],
  },
};

export default function TaiAppPage() {
  return <SmartAppDownloadLanding />;
}
