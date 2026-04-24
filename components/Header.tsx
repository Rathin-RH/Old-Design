'use client';

import { motion } from 'framer-motion';
import { Printer, Wifi, WifiOff, AlertCircle, Check } from 'lucide-react';
import { useKioskStore } from '@/lib/store';
import { getStatusColor } from '@/lib/utils';

export default function Header() {
  const { printerStatus, kioskSettings } = useKioskStore();

  const getStatusIcon = () => {
    switch (printerStatus) {
      case 'ready':
      case 'connected':
        return <Check className="w-5 h-5" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5" />;
      case 'maintenance':
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'printing':
        return <Printer className="w-5 h-5 animate-pulse" />;
      default:
        return <Wifi className="w-5 h-5" />;
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="bg-gradient-to-br from-primary-500 to-purple-600 p-3 rounded-2xl"
            >
              <Printer className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                VPrint Kiosk
              </h1>
              <p className="text-sm text-gray-600">
                {kioskSettings?.name || 'Smart Printing Station'}
              </p>
            </div>
          </motion.div>

          {/* Printer Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`${getStatusColor(printerStatus)} p-2 rounded-full`}
            >
              {getStatusIcon()}
            </motion.div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Printer Status</p>
              <p className="text-sm font-bold capitalize text-gray-800">
                {printerStatus}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

