'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useKioskStore } from '@/lib/store';
import { Advertisement } from '@/lib/types';
import { AdvertisementService } from '@/lib/advertisementService';

// Default advertisements if none are configured
const defaultAds: Advertisement[] = [
  {
    id: '1',
    type: 'image',
    title: 'Student Discount',
    imageUrl: 'https://via.placeholder.com/1920x1080/667eea/ffffff?text=Student+Discount+Available',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'image',
    title: 'Fast Printing',
    imageUrl: 'https://via.placeholder.com/1920x1080/764ba2/ffffff?text=Fast+%26+Reliable+Printing',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'image',
    title: 'Campus Services',
    imageUrl: 'https://via.placeholder.com/1920x1080/f093fb/ffffff?text=Campus+Services',
    duration: 5,
    isActive: true,
    createdAt: new Date(),
  },
];

interface Props {
  onClose?: () => void;
  autoRotate?: boolean;
  showControls?: boolean;
}

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export default function AdvertisementScreen({ onClose, autoRotate = true, showControls = true }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { kioskSettings } = useKioskStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imagePreloadRef = useRef<Set<string>>(new Set());

  // Memoize filtered advertisements to prevent unnecessary re-renders
  const advertisements = useMemo(() => {
    return kioskSettings?.advertisements?.filter(ad => ad.isActive) || defaultAds;
  }, [kioskSettings?.advertisements]);

  // Preload next ad image
  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % advertisements.length;
    const nextAd = advertisements[nextIndex];
    
    if (nextAd?.type === 'image' && nextAd.imageUrl && !imagePreloadRef.current.has(nextAd.imageUrl)) {
      const img = new Image();
      img.src = nextAd.imageUrl;
      imagePreloadRef.current.add(nextAd.imageUrl);
    }
  }, [currentIndex, advertisements]);

  // Display count tracking disabled for anonymous kiosk users (permission restrictions)
  // This is analytics-only and not critical for functionality
  // Uncomment below if you have admin authentication enabled
  /*
  useEffect(() => {
    if (advertisements.length === 0) return;
    const currentAd = advertisements[currentIndex];
    if (currentAd?.id) {
      const timeoutId = setTimeout(() => {
        AdvertisementService.incrementDisplayCount(KIOSK_ID, currentAd.id).catch(() => {
          // Silently fail - analytics only
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, advertisements]);
  */

  // Progress bar animation (optimized to prevent flicker)
  useEffect(() => {
    if (advertisements.length === 0 || !autoRotate || isPaused) {
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(0);
      return;
    }

    const currentAd = advertisements[currentIndex];
    const duration = (currentAd?.duration || 5) * 1000;
    const interval = 100; // Update every 100ms (reduced frequency to prevent flicker)
    const steps = Math.ceil(duration / interval);
    
    setProgress(0);
    let step = 0;
    
    const updateProgress = () => {
      step++;
      const newProgress = Math.min((step / steps) * 100, 100);
      setProgress(newProgress);
      
      if (step >= steps) {
        setCurrentIndex((prev) => (prev + 1) % advertisements.length);
      } else {
        progressIntervalRef.current = setTimeout(updateProgress, interval) as any;
      }
    };
    
    progressIntervalRef.current = setTimeout(updateProgress, interval) as any;

    return () => {
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentIndex, advertisements, autoRotate, isPaused]);

  // Handle video playback and image loading (optimized to prevent flicker)
  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const currentAd = advertisements[currentIndex];
    let isMounted = true;
    
    // Only show loading for videos or if image hasn't been preloaded
    if (currentAd.type === 'video' || !imagePreloadRef.current.has(currentAd.imageUrl || '')) {
      setIsLoading(true);
    }
    
    if (currentAd.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.load();
      
      const handleCanPlay = () => {
        if (isMounted) {
          setIsLoading(false);
          video.play().catch(() => {
            // Silently handle play errors
          });
        }
      };
      
      const handleError = () => {
        if (isMounted) setIsLoading(false);
      };
      
      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.addEventListener('error', handleError, { once: true });
      
      return () => {
        isMounted = false;
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.pause();
        video.src = '';
      };
    } else if (currentAd.type === 'image' && currentAd.imageUrl) {
      // Check if already preloaded
      if (imagePreloadRef.current.has(currentAd.imageUrl)) {
        setIsLoading(false);
      } else {
        const img = new Image();
        img.onload = () => {
          if (isMounted) setIsLoading(false);
        };
        img.onerror = () => {
          if (isMounted) setIsLoading(false);
        };
        img.src = currentAd.imageUrl;
      }
    } else {
      setIsLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentIndex, advertisements]);

  // All hooks must be called before any conditional returns
  const currentAd = advertisements[currentIndex] || advertisements[0];
  const hasMultipleAds = advertisements.length > 1;

  const handleNext = useCallback(() => {
    if (advertisements.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    setProgress(0);
  }, [advertisements.length]);

  const handlePrevious = useCallback(() => {
    if (advertisements.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
    setProgress(0);
  }, [advertisements.length]);

  const handleAdClick = useCallback(() => {
    if (advertisements.length === 0) return;
    const ad = advertisements[currentIndex];
    if (ad?.link) {
      window.open(ad.link, '_blank');
      // Click tracking disabled for anonymous users (permission restrictions)
      // Uncomment below if you have admin authentication enabled
      // if (ad.id) {
      //   AdvertisementService.trackAdClick(KIOSK_ID, ad.id).catch(() => {});
      // }
    }
  }, [currentIndex, advertisements]);

  // Keyboard navigation
  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === ' ' || e.key === 'Space') setIsPaused(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, onClose, advertisements.length]);

  // Early return after all hooks
  if (advertisements.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <p className="text-white text-xl">No advertisements available</p>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Close Button */}
      {onClose && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
          aria-label="Close advertisements"
        >
          <X className="w-6 h-6 md:w-8 md:h-8" />
        </motion.button>
      )}

      {/* Pause/Play Button */}
      {hasMultipleAds && autoRotate && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsPaused(!isPaused)}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? (
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          )}
        </motion.button>
      )}

      {/* Advertisement Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full flex items-center justify-center"
          onClick={currentAd.link ? handleAdClick : undefined}
          style={{ cursor: currentAd.link ? 'pointer' : 'default' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {currentAd.type === 'image' && currentAd.imageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                className="w-full h-full object-contain"
                draggable={false}
                loading="eager"
                decoding="async"
              />
              {currentAd.link && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-white/30 transition-all"
                >
                  <span className="text-white text-sm font-medium">Click to learn more</span>
                  <ExternalLink className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
          ) : currentAd.type === 'video' && currentAd.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={currentAd.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  console.error('Video playback error:', e);
                }}
              />
              {currentAd.link && (
                <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="text-white text-sm font-medium">Click to learn more</span>
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center px-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">{currentAd.title}</h2>
              {currentAd.link && (
                <a
                  href={currentAd.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-full text-white font-medium transition-all"
                >
                  Learn More
                </a>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {showControls && hasMultipleAds && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 md:p-4 rounded-full transition-all hover:scale-110"
            aria-label="Previous advertisement"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 md:p-4 rounded-full transition-all hover:scale-110"
            aria-label="Next advertisement"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </button>
        </>
      )}

      {/* Progress Indicators with Progress Bar */}
      {hasMultipleAds && (
        <>
          {/* Progress Bar */}
          {autoRotate && !isPaused && (
            <div className="absolute bottom-16 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden z-40">
              <div
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-40">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setProgress(0);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to advertisement ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Advertisement Title Overlay */}
      {currentAd.title && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-0 right-0 text-center z-30"
        >
          <h3 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
            {currentAd.title}
          </h3>
        </motion.div>
      )}
    </div>
  );
}

