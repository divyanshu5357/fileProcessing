'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PdfEditorWorkspace } from '@/components/editor/PdfEditorWorkspace';
import { MainCategory } from '@/types/document';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

export default function DedicatedPdfEditorPage() {
  const router = useRouter();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const handleSelectCategory = (category: MainCategory) => {
    if (category === 'image-tools') {
      router.push('/');
    } else if (category === 'pdf-tools') {
      router.push('/pdf');
    } else if (category === 'document-converter') {
      router.push('/documents');
    } else if (category === 'image-converter') {
      router.push('/image-converter');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] selection:bg-[#2563EB] selection:text-white transition-colors">
      <Header
        activeCategory="pdf-tools"
        onSelectCategory={handleSelectCategory}
        onAddImages={() => router.push('/')}
        onClearWorkspace={() => {}}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenPrivacyInfo={() => setPrivacyModalOpen(true)}
        queueLength={0}
      />

      <main className="flex-1 flex flex-col">
        <PdfEditorWorkspace onBackToTools={() => router.push('/pdf')} />
      </main>

      <Footer />

      <PrivacyBanner
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
