'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKioskStore } from '@/lib/store';
import { Advertisement } from '@/lib/types';

// Default advertisements if none are configured
const defaultAds: Advertisement[] = [
  {
    id: '1',
    type: 'image',
    title: 'Student Discount',
    imageUrl: 'https://via.placeholder.com/1200x300/667eea/ffffff?text=Student+Discount+Available',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'image',
    title: 'Fast Printing',
    imageUrl: 'https://via.placeholder.com/1200x300/764ba2/ffffff?text=Fast+%26+Reliable+Printing',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'image',
    title: 'Campus Services',
    imageUrl: 'https://via.placeholder.com/1200x300/f093fb/ffffff?text=Campus+Services',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
];

export default function AdvertisementCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { kioskSettings } = useKioskStore();

  const advertisements = kioskSettings?.advertisements?.filter(ad => ad.isActive) || defaultAds;

  useEffect(() => {
    if (advertisements.length === 0) return;

    const currentAd = advertisements[currentIndex];
    const duration = (currentAd?.duration || 5) * 1000;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, duration);

    return () => clearInterval(timer);
  }, [currentIndex, advertisements]);

  if (advertisements.length === 0) return null;

  return (
    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="relative h-48 md:h-64 bg-gradient-to-r from-primary-500 to-purple-600"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Advertisement Content */}
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center px-8">
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                {advertisements[currentIndex].title}
              </motion.h3>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full"
              >
                <p className="text-white text-sm font-medium">
                  ⚡ Special Offer for Students
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {advertisements.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {advertisements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Next/Prev Buttons */}
      {advertisements.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-full transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % advertisements.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-full transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

