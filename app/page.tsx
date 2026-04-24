'use client';

import { useEffect } from 'react';
import { useKioskStore } from '@/lib/store';
import { KioskService } from '@/lib/kioskService';
import { AuthService } from '@/lib/authService';
import MainKiosk from '@/components/MainKiosk';
import AdminPanel from '@/components/AdminPanel';
import SecretButton from '@/components/SecretButton';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';
const IDLE_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT || '60000', 10);

export default function Home() {
  const {
    isAdminPanelOpen,
    setIsIdle,
    setKioskSettings,
    setPrinterStatus,
    updateLastActivity,
    lastActivity,
  } = useKioskStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let updateTimeout: NodeJS.Timeout | undefined;

    const init = async () => {
      try {
        console.log('KIOSK_ID:', KIOSK_ID);
        console.log('Starting kiosk auth...');

        await AuthService.ensureKioskAuth();

        console.log('Auth completed, fetching kiosk settings...');
        const settings = await KioskService.getKioskSettings(KIOSK_ID);

        console.log('Kiosk settings:', settings);

        if (settings) {
          setKioskSettings(settings);
          setPrinterStatus(settings.printerStatus);
        }

        unsubscribe = KioskService.subscribeToKiosk(KIOSK_ID, (settings) => {
          if (!settings) return;

          if (updateTimeout) clearTimeout(updateTimeout);

          updateTimeout = setTimeout(() => {
            setKioskSettings(settings);
            setPrinterStatus(settings.printerStatus);
          }, 300);
        });
      } catch (error) {
        console.error('Kiosk initialization failed:', error);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
      if (updateTimeout) clearTimeout(updateTimeout);
    };
  }, [setKioskSettings, setPrinterStatus]);

  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivity > IDLE_TIMEOUT) {
        setIsIdle(true);
      }
    };

    checkIdle();
    const interval = setInterval(checkIdle, 5000);

    return () => clearInterval(interval);
  }, [lastActivity, setIsIdle]);

  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keypress', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, [updateLastActivity]);

  return (
    <main className="kiosk-container">
      <MainKiosk />
      <SecretButton />
      {isAdminPanelOpen && <AdminPanel />}
    </main>
  );
}