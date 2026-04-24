'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useKioskStore } from '@/lib/store';

interface Props {
  message: string;
  onRetry?: () => void;
  dismissible?: boolean;
}

export default function ErrorMessage({ message, onRetry, dismissible = true }: Props) {
  const { setError } = useKioskStore();

  useEffect(() => {
    // Auto-dismiss after 8 seconds (longer for better UX)
    const timer = setTimeout(() => {
      if (dismissible) {
        setError(null);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [setError, dismissible]);

  const handleDismiss = () => {
    if (dismissible) {
      setError(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-lg md:max-w-xl w-full mx-4"
    >
      <div className="bg-white border-2 border-black text-black rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 flex items-start gap-3 md:gap-4 animate-shake">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="flex-shrink-0"
        >
          <AlertCircle className="w-6 h-6 md:w-7 md:h-7" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base md:text-lg mb-1 text-black">Error</h3>
          <p className="text-sm md:text-base text-black break-words">{message}</p>
          
          {/* Retry button if provided */}
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            aria-label="Dismiss error"
          >
              <X className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {dismissible && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 8, ease: 'linear' }}
          className="h-1 bg-gray-200 rounded-full mt-2"
        />
      )}
    </motion.div>
  );
}

