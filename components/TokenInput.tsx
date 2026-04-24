'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Delete } from 'lucide-react';
import { toast } from 'sonner';
import { useKioskStore } from '@/lib/store';
import { PrintService } from '@/lib/printService';
import { validateToken, playSound } from '@/lib/utils';

export default function TokenInput() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { setCurrentJob, setError, updateLastActivity } = useKioskStore();

  // Validate token
  const isValid = token.length === 6;

  // Shake animation on error
  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    playSound('error');
    toast.error(msg);

    setTimeout(() => setIsShaking(false), 500);
  };

  // Handle keypad input
  const handleInput = (val: string) => {
    updateLastActivity();

    if (val === 'del') {
      setToken((prev) => prev.slice(0, -1));
    } else if (token.length < 6) {
      setToken((prev) => prev + val);
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateToken(token)) {
      return triggerError('Token must be exactly 6 digits');
    }

    setIsLoading(true);
    setError(null);

    try {
      const job = await PrintService.fetchPrintJob(token);

      if (!job) {
        setToken('');
        return triggerError('Invalid or already used token');
      }

      if (job.paymentStatus !== 'completed') {
        setToken('');
        return triggerError('Payment not completed');
      }

      playSound('success');
      toast.success('Token verified');

      setCurrentJob(job);
      setToken('');
    } catch (err) {
      console.error(err);
      setToken('');
      triggerError('System error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white">
      <div className="w-full max-w-md p-6">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Enter Your Mimo Code</h2>
          <p className="text-white/70 text-sm">
            Enter your 6-digit code provided to you
          </p>
        </div>

        {/* SLOT DISPLAY */}
        <div className={`flex justify-center gap-3 mb-8 ${isShaking ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`
                w-12 h-14 flex items-center justify-center text-xl font-bold rounded-xl border-2
                ${i < token.length ? 'bg-white/20 border-white' : 'bg-white/10 border-white/30'}
                ${isShaking ? 'border-red-400 bg-red-500/20' : ''}
              `}
            >
              {token[i] || ''}
            </div>
          ))}
        </div>

        {/* KEYPAD */}
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7,8,9].map((num) => (
            <button
              key={num}
              onClick={() => handleInput(String(num))}
              disabled={token.length >= 6 || isLoading}
              className="h-14 rounded-xl bg-white/10 hover:bg-white/20 text-xl font-bold"
            >
              {num}
            </button>
          ))}

          {/* DELETE */}
          <button
            onClick={() => handleInput('del')}
            className="h-14 rounded-xl bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
          >
            <Delete />
          </button>

          {/* ZERO */}
          <button
            onClick={() => handleInput('0')}
            className="h-14 rounded-xl bg-white/10 hover:bg-white/20 text-xl font-bold"
          >
            0
          </button>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className={`
              h-14 rounded-xl flex items-center justify-center
              ${isValid ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20'}
            `}
          >
            {isLoading ? '...' : <Check />}
          </button>
        </div>
      </div>

      {/* SHAKE ANIMATION */}
      <style jsx>{`
        .animate-shake {
          animation: shake 0.4s;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}