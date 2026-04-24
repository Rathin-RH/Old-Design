'use client';

import { useEffect } from 'react';
import { useKioskStore } from '@/lib/store';

const SECRET_TAP_COUNT = parseInt(process.env.NEXT_PUBLIC_ADMIN_SECRET_SEQUENCE || '5');

export default function SecretButton() {
  const { 
    adminSecretTaps, 
    incrementSecretTaps, 
    resetSecretTaps, 
    setAdminPanelOpen 
  } = useKioskStore();

  useEffect(() => {
    // Reset taps after 3 seconds of inactivity
    const timer = setTimeout(() => {
      if (adminSecretTaps > 0 && adminSecretTaps < SECRET_TAP_COUNT) {
        resetSecretTaps();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [adminSecretTaps, resetSecretTaps]);

  useEffect(() => {
    // Open admin panel when secret sequence is complete
    if (adminSecretTaps >= SECRET_TAP_COUNT) {
      setAdminPanelOpen(true);
      resetSecretTaps();
    }
  }, [adminSecretTaps, setAdminPanelOpen, resetSecretTaps]);

  return (
    <button
      onClick={incrementSecretTaps}
      className="fixed bottom-4 left-4 w-12 h-12 opacity-0 hover:opacity-10 transition-opacity"
      aria-label="Secret admin button"
    >
      <div className="w-full h-full bg-gray-300 rounded-full" />
    </button>
  );
}

