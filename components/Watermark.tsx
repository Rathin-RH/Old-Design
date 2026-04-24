'use client';

export default function Watermark() {
  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-[5] pointer-events-none">
      <p className="text-xs text-gray-400/60 font-light tracking-wide">
        Software designed and developed by{' '}
        <span className="font-medium text-gray-500/70">Sudobox</span>
      </p>
    </div>
  );
}

