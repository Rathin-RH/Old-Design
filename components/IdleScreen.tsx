'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Hash, Sparkles } from 'lucide-react';
import { useKioskStore } from '@/lib/store';

export default function IdleScreen() {
  const { setIsIdle } = useKioskStore();
  const [isMounted, setIsMounted] = useState(false);
  const [sparklePositions, setSparklePositions] = useState<Array<{ x: number; y: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    setIsMounted(true);
    // Generate random positions only on client side
    if (typeof window !== 'undefined') {
      const positions = Array.from({ length: 20 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      }));
      setSparklePositions(positions);
    }
  }, []);

  const handleWakeup = () => {
    setIsIdle(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleWakeup}
      className="kiosk-main bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 flex items-center justify-center cursor-pointer relative"
    >
      {/* Animated Background */}
      {isMounted && (
      <div className="absolute inset-0">
          {sparklePositions.map((pos, i) => (
          <motion.div
            key={i}
            initial={{ 
                x: pos.x,
                y: pos.y,
              scale: 0 
            }}
            animate={{ 
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
                duration: pos.duration,
              repeat: Infinity,
                delay: pos.delay,
            }}
            className="absolute"
          >
            <Sparkles className="w-6 h-6 text-white/30" />
          </motion.div>
        ))}
      </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center px-8">
        {/* Logo */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="mb-8 flex justify-center"
        >
          <div className="bg-white/20 backdrop-blur-lg p-8 rounded-full">
            <Printer className="w-24 h-24 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          animate={{ 
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          VPrint Kiosk
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-3xl text-white/90 mb-12"
        >
          Touch anywhere to start
        </motion.p>

        {/* Features */}
        <div className="flex justify-center gap-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-effect p-6 rounded-2xl"
          >
            <Hash className="w-12 h-12 text-white mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Enter Token</h3>
            <p className="text-white/80 text-sm">6-digit print code</p>
          </motion.div>
        </div>

        {/* Pulse Animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/20 rounded-full"
        />
        
        <motion.p
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white text-lg font-medium"
        >
          👆 Tap to begin
        </motion.p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-20 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
    </motion.div>
  );
}

