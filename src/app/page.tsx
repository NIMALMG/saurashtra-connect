import type { Metadata } from 'next';
import HomeContent from '@/components/home/HomeContent';

export const metadata: Metadata = {
  title: 'Saurashtra Connect — Preserving Our Language Together',
  description:
    'Join the Saurashtra community to preserve our language through words, voice recordings, and stories.',
};

export default function HomePage() {
  return (
    <>
      <HomeContent />
    </>
  );
}
