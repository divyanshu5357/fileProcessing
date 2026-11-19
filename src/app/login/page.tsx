'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const router = useRouter();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/workspace');
    } else if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      openAuthModal();
    }
  }, [isAuthenticated, openAuthModal, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="flex items-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-[#536BCE]" />
        <span>Redirecting to Gyanvatsala sign in...</span>
      </div>
    </div>
  );
}
