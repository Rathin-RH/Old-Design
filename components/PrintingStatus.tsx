'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useKioskStore } from '@/lib/store';
import { PrintService } from '@/lib/printService';
import { KioskService } from '@/lib/kioskService';
import { playSound } from '@/lib/utils';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

interface Props {
  isActive: boolean;
  job: any;
  onComplete: () => void;
}

export default function PrintingStatus({
  isActive,
  job,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSub, setTypedSub] = useState('');

  const intervalRef = useRef<any>(null);
  const hasStartedRef = useRef(false);

  const { setPrinterStatus, setCurrentJob } = useKioskStore();

  // -----------------------------
  // TEXT TYPING EFFECT
  // -----------------------------
  useEffect(() => {
    if (!isActive) return;

    const title = 'Printing in Progress';
    const sub = 'Preparing your documents...';

    let i = 0;
    let j = 0;

    const t1 = setInterval(() => {
      setTypedTitle(title.slice(0, i + 1));
      i++;
      if (i >= title.length) clearInterval(t1);
    }, 40);

    const t2 = setInterval(() => {
      setTypedSub(sub.slice(0, j + 1));
      j++;
      if (j >= sub.length) clearInterval(t2);
    }, 25);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [isActive]);

  // -----------------------------
  // MAIN PRINT FLOW
  // -----------------------------
  useEffect(() => {
    if (!isActive || hasStartedRef.current) return;

    hasStartedRef.current = true;

    const runPrint = async () => {
      try {
        setPrinterStatus('printing');
        setProgress(10);

        // Step 1: processing delay
        await new Promise((r) => setTimeout(r, 800));
        setProgress(30);

        // Step 2: send print job
        const result = await PrintService.silentDirectPrint(
          job,
          job.documentUrl
        );

        setProgress(60);

        if (!result.success) {
          throw new Error('Print failed');
        }

        // Step 3: simulate printer progress OR poll real job
        let current = 60;

        intervalRef.current = setInterval(() => {
          current += 3;

          if (current >= 95) {
            clearInterval(intervalRef.current);
            setProgress(95);
          } else {
            setProgress(current);
          }
        }, 400);

        // Step 4: final complete
        await new Promise((r) => setTimeout(r, 4000));

        setProgress(100);
        setPrinterStatus('ready');

        await PrintService.updateJobStatus(job.id, 'completed', KIOSK_ID);

        playSound('success');

        await KioskService.logActivity(KIOSK_ID, 'print_completed', {
          jobId: job.id,
        });

        setTimeout(() => {
          onComplete();
          setCurrentJob(null);
        }, 1500);

      } catch (err: any) {
        console.error(err);

        setPrinterStatus('error');
        playSound('error');

        await PrintService.updateJobStatus(job.id, 'failed', KIOSK_ID);

        await KioskService.logActivity(KIOSK_ID, 'print_failed', {
          jobId: job.id,
          error: err?.message,
        });

        setTimeout(() => {
          onComplete();
          setCurrentJob(null);
        }, 2000);
      }
    };

    runPrint();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, job, onComplete]);

  // -----------------------------
  // UI CALC
  // -----------------------------
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  // -----------------------------
  // UI (YOUR DESIGN)
  // -----------------------------
  return (
    <div
      style={{
        display: isActive ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '100px',
        padding: '0 100px',
        height: '100vh',
        background: '#0f172a',
        color: 'white',
      }}
    >
      {/* LEFT TEXT */}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '72px', fontWeight: 800 }}>
          {typedTitle}
        </h2>
        <p style={{ fontSize: '28px', opacity: 0.8 }}>
          {typedSub}
        </p>
      </div>

      {/* RIGHT PROGRESS */}
      <div style={{ position: 'relative' }}>
        <svg width="380" height="380">
          <circle
            cx="190"
            cy="190"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="20"
            fill="transparent"
          />
          <circle
            cx="190"
            cy="190"
            r={radius}
            stroke="#10b981"
            strokeWidth="20"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: '0.3s' }}
            transform="rotate(-90 190 190)"
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '64px',
            fontWeight: 900,
          }}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}