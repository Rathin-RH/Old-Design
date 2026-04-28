'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ScalingWrapperProps {
  children: ReactNode;
  targetWidth?: number;
  targetHeight?: number;
}

/**
 * ScalingWrapper
 * Automatically scales the content to fit the viewport while maintaining aspect ratio.
 * Perfect for fixed-size kiosk layouts.
 */
export default function ScalingWrapper({
  children,
  targetWidth = 1333,
  targetHeight = 794,
}: ScalingWrapperProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculate scale to fit both width and height (contain)
      const scaleX = windowWidth / targetWidth;
      const scaleY = windowHeight / targetHeight;
      
      // Use the smaller scale to ensure it fits entirely
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1:1

      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetWidth, targetHeight]);

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transition: 'transform 0.2s ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
