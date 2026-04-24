'use client';

import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, X } from 'lucide-react';

/**
 * Responsive Tester Component
 * Shows current viewport size and allows testing different screen sizes
 * Only visible in development mode
 */
export default function ResponsiveTester() {
  const [isVisible, setIsVisible] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [preset, setPreset] = useState<string | null>(null);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const presets = {
    'Mobile Small': { width: 375, height: 667 }, // iPhone SE
    'Mobile Medium': { width: 390, height: 844 }, // iPhone 12/13
    'Mobile Large': { width: 428, height: 926 }, // iPhone 14 Pro Max
    'Tablet Portrait': { width: 768, height: 1024 }, // iPad
    'Tablet Landscape': { width: 1024, height: 768 }, // iPad Landscape
    'Desktop Small': { width: 1280, height: 720 }, // HD
    'Desktop Medium': { width: 1920, height: 1080 }, // Full HD
    'Desktop Large': { width: 2560, height: 1440 }, // 2K
    'Kiosk Portrait': { width: 1080, height: 1920 }, // Common kiosk portrait
    'Kiosk Landscape': { width: 1920, height: 1080 }, // Common kiosk landscape
  };

  const applyPreset = (name: string, dimensions: { width: number; height: number }) => {
    setPreset(name);
    // Note: In browser, we can't actually resize the window, but we can show the dimensions
    // For actual testing, use browser DevTools responsive mode
    console.log(`Testing preset: ${name} - ${dimensions.width}x${dimensions.height}`);
  };

  const breakpoint = 
    viewport.width < 640 ? 'sm (mobile)' :
    viewport.width < 768 ? 'md (tablet)' :
    viewport.width < 1024 ? 'lg (desktop)' :
    viewport.width < 1280 ? 'xl (large)' :
    '2xl (extra large)';

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Toggle Responsive Tester"
      >
        <Monitor className="w-5 h-5" />
      </button>

      {/* Tester Panel */}
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 w-80 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Responsive Tester</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Viewport Info */}
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <div className="text-sm font-semibold text-gray-700 mb-2">Current Viewport</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Width: <span className="font-mono font-bold">{viewport.width}px</span></div>
              <div>Height: <span className="font-mono font-bold">{viewport.height}px</span></div>
              <div>Breakpoint: <span className="font-mono font-bold">{breakpoint}</span></div>
              <div>Aspect Ratio: <span className="font-mono font-bold">{(viewport.width / viewport.height).toFixed(2)}</span></div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Test Presets</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(presets).map(([name, dimensions]) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name, dimensions)}
                  className={`text-left px-3 py-2 rounded border-2 transition-all ${
                    preset === name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {dimensions.width}×{dimensions.height}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded border border-yellow-200">
            <strong>Tip:</strong> Use browser DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M) to actually resize the viewport.
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Reload
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${viewport.width}x${viewport.height}`);
                }}
                className="flex-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Copy Size
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



