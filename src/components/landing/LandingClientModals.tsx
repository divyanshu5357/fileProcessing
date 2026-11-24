'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const PrivacyBanner = dynamic(
  () => import('@/components/PrivacyBanner').then((mod) => mod.PrivacyBanner),
  { ssr: false }
);

const KeyboardShortcutsModal = dynamic(
  () => import('@/components/KeyboardShortcutsModal').then((mod) => mod.KeyboardShortcutsModal),
  { ssr: false }
);

export function LandingClientModals() {
  const router = useRouter();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Backwards compatibility for legacy query parameters (?tab=..., ?tool=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const tool = params.get('tool');
      if (tab === 'pdf-tools' || tool) {
        router.push(tool ? `/pdf/${tool}` : '/pdf');
      } else if (tab === 'scan-studio') {
        router.push('/scan-studio');
      } else if (tab === 'image-converter') {
        router.push('/image-converter');
      } else if (tab === 'image-tools') {
        router.push('/image-tools');
      }
    }
  }, [router]);

  return (
    <>
      <PrivacyBanner
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </>
  );
}
