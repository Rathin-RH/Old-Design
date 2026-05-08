import React, { useEffect, useState, useRef } from 'react';

interface PrintingScreenProps {
  isActive: boolean;
  statusTitle?: string;
  statusSub?: string;
  onComplete: () => void;
  pages?: number;
  manualProgress?: number;
}

export const PrintingScreen: React.FC<PrintingScreenProps> = ({ 
  isActive, 
  statusTitle, 
  statusSub, 
  onComplete,
  pages = 1,
  manualProgress 
}) => {
  const [progress, setProgress] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSub, setTypedSub] = useState('');
  const intervalRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);

  // Sync with manualProgress if provided
  useEffect(() => {
    if (manualProgress !== undefined) {
      if (manualProgress >= 100 && isActive) {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setProgress(100); // Ensure it reaches 100% visually
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
        completionTimerRef.current = window.setTimeout(() => {
          onComplete();
          completionTimerRef.current = null;
        }, 1500);
      }
    }
  }, [manualProgress, onComplete, isActive]);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setTypedTitle('');
      setTypedSub('');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      return;
    }

    // Typing effect for text
    setTypedTitle('');
    setTypedSub('');
    const targetTitle = statusTitle || "Printing in Progress";
    const targetSub = statusSub || "Preparing your documents...";
    let titleIdx = 0;
    let subIdx = 0;

    const titleInterval = setInterval(() => {
       setTypedTitle(targetTitle.slice(0, titleIdx + 1));
       titleIdx++;
       if (titleIdx >= targetTitle.length) clearInterval(titleInterval);
    }, 40);

    const subInterval = setInterval(() => {
       setTypedSub(targetSub.slice(0, subIdx + 1));
       subIdx++;
       if (subIdx >= targetSub.length) clearInterval(subInterval);
    }, 30);

    // Fixed 15-second loading experience
    if (!intervalRef.current) {
      const totalTime = 15000; // Exactly 15 seconds
      const stepTime = totalTime / 100; // 150ms per 1%

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             return 100;
          }
          // If we have manual progress from Firestore, sync to it
          if (manualProgress !== undefined && manualProgress > prev) {
             return manualProgress;
          }

          const next = prev + 1;
          if (next >= 99) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             // Stop at 99%. We wait for manualProgress to reach 100% 
             // to trigger the actual completion and screen transition.
             return 99;
          }
          return next;
        });
      }, stepTime);
    }
    
    return () => {
       clearInterval(titleInterval);
       clearInterval(subInterval);
    };
  }, [isActive, onComplete, statusTitle, statusSub, pages, manualProgress]);

  // Continuous rotation for running effect could be added here, but running digits is enough based on request.

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
        className={`screen printing-wrap ${isActive ? 'visible' : ''}`} 
        style={{ 
            display: isActive ? 'flex' : 'none', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '100px', 
            padding: '0 100px',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <style>{`
            @keyframes spin-slow { 100% { transform: rotate(360deg); } }
            @keyframes spin-slow-reverse { 100% { transform: rotate(-360deg); } }
            @keyframes pulse-ring {
                0% { transform: scale(0.85); opacity: 0; }
                50% { opacity: 0.55; }
                100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes float-motif {
                0%   { transform: translate(0,0) scale(0.5) rotate(-15deg); opacity: 0; }
                15%  { opacity: 1; }
                80%  { opacity: 0.9; transform: translate(130px,-55px) scale(0.85) rotate(10deg); }
                100% { transform: translate(170px,-75px) scale(0.35) rotate(20deg); opacity: 0; }
            }
            @keyframes bg-float {
                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.07; }
                50%       { transform: translateY(-16px) rotate(12deg); opacity: 0.13; }
            }
            @keyframes text-glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 12px rgba(255,105,150,0.35)); }
                50%       { filter: drop-shadow(0 0 28px rgba(255,105,150,0.75)); }
            }
            @keyframes data-stream {
                0%   { background-position: -200% 0; }
                100% { background-position:  200% 0; }
            }
            .printing-particle {
                position: absolute;
                filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
                animation: float-motif 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            }
            .p-heart  { width: 36px; height: 36px; }
            .p-flower { width: 44px; height: 44px; }
            .particle-2 { animation-delay: 0.9s;  top: 22px; }
            .particle-3 { animation-delay: 1.75s; top: -14px; }
            .bg-motif { position: absolute; pointer-events: none; animation: bg-float 6s ease-in-out infinite; }
            .data-text-highlight {
                background: linear-gradient(90deg, #ffffff 0%, #ff80ab 30%, #ffffff 60%);
                background-size: 200% auto;
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: data-stream 3s linear infinite;
            }
            .love-tagline {
                font-family: 'Dancing Script', cursive;
                font-size: 34px;
                font-weight: 700;
                color: #ffffff;
                text-shadow:
                    0 0 12px rgba(255, 128, 171, 0.9),
                    0 0 28px rgba(255, 128, 171, 0.6),
                    0 2px 4px rgba(0, 0, 0, 0.4);
                animation: data-stream 4s linear infinite;
                margin-top: 12px;
                letter-spacing: 1.5px;
                display: block;
            }
        `}</style>

        {/* Scattered background flowers & hearts */}
        {isActive && (
            <>
                <div className="bg-motif" style={{ top: '6%', left: '3%', width: 50, height: 50, animationDelay: '0s' }}>
                    <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="9" fill="#FFD700"/>{[0,60,120,180,240,300].map((d,i)=><ellipse key={i} cx="32" cy="14" rx="7" ry="12" fill="#ffb3c6" opacity="0.85" transform={`rotate(${d} 32 32)`}/>)}</svg>
                </div>
                <div className="bg-motif" style={{ top: '5%', right: '4%', width: 36, height: 36, animationDelay: '1.5s' }}>
                    <svg viewBox="0 0 24 24" fill="#ff80ab"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="bg-motif" style={{ bottom: '8%', left: '5%', width: 30, height: 30, animationDelay: '2.5s' }}>
                    <svg viewBox="0 0 24 24" fill="#c084fc"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="bg-motif" style={{ bottom: '9%', right: '3%', width: 46, height: 46, animationDelay: '3.5s' }}>
                    <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="9" fill="#FFD700"/>{[0,60,120,180,240,300].map((d,i)=><ellipse key={i} cx="32" cy="14" rx="6" ry="11" fill="#c084fc" opacity="0.85" transform={`rotate(${d} 32 32)`}/>)}</svg>
                </div>
                <div className="bg-motif" style={{ top: '45%', left: '1.5%', width: 26, height: 26, animationDelay: '4s' }}>
                    <svg viewBox="0 0 24 24" fill="#ff80ab"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
            </>
        )}

        {/* Left Column: Context & Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '30px', flex: 1, textAlign: 'left', maxWidth: '750px', zIndex: 10 }}>
            <div style={{ minHeight: '180px' }}>
                <h2 style={{ fontSize: '92px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-3px', lineHeight: '1.05', display: 'flex' }}>
                    <span className={isActive ? "data-text-highlight" : ""}>{typedTitle}</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '36px', fontWeight: 500, lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                    {typedSub}
                </p>
                {isActive && <p className="love-tagline">🌸 Printing with Love & Care🌸</p>}
            </div>
        </div>

        {/* Right Column: Giant Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

            {/* Flying Hearts & Flowers toward the ring */}
            {isActive && progress < 100 && (
                <div style={{ position: 'absolute', left: '-140px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                    <div className="printing-particle p-heart">
                        <svg viewBox="0 0 24 24" fill="#ff80ab"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <div className="printing-particle p-flower particle-2">
                        <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="9" fill="#FFD700"/>{[0,60,120,180,240,300].map((d,i)=><ellipse key={i} cx="32" cy="14" rx="7" ry="12" fill="#ffb3c6" opacity="0.9" transform={`rotate(${d} 32 32)`}/>)}</svg>
                    </div>
                    <div className="printing-particle p-heart particle-3">
                        <svg viewBox="0 0 24 24" fill="#c084fc"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                </div>
            )}

            <div className="circular-progress-container" style={{ position: 'relative', width: '380px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Dynamic Glow Background */}
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #ff80ab 0%, #c084fc 100%)',
                    filter: 'blur(65px)',
                    opacity: 0.12 + (progress / 100) * 0.28,
                    transition: 'opacity 0.3s',
                }} />
                
                {/* Expanding pulse rings */}
                {isActive && progress < 100 && (
                    <>
                        <div style={{
                            position: 'absolute', inset: '45px', borderRadius: '50%', border: '2px solid rgba(255,128,171,0.45)',
                            animation: 'pulse-ring 3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite', pointerEvents: 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute', inset: '45px', borderRadius: '50%', border: '2px solid rgba(192,132,252,0.35)',
                            animation: 'pulse-ring 3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite 1.5s', pointerEvents: 'none'
                        }}></div>
                    </>
                )}

                <svg width="380" height="380" style={{ position: 'absolute', zIndex: 2 }}>
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ff80ab" />
                            <stop offset="50%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#ffb3c6" />
                        </linearGradient>
                    </defs>

                    {/* Outer Dashed Rotating Ring */}
                    <g style={{ transformOrigin: 'center', animation: isActive ? 'spin-slow 24s linear infinite' : 'none' }}>
                        <circle cx="190" cy="190" r="176" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray="12 18" />
                    </g>
                    
                    {/* Inner Dotted Rotating Ring */}
                    <g style={{ transformOrigin: 'center', animation: isActive ? 'spin-slow-reverse 18s linear infinite' : 'none' }}>
                        <circle cx="190" cy="190" r="105" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" />
                    </g>

                    <g style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                        {/* Background Track */}
                        <circle 
                          cx="190" cy="190" r={radius} 
                          fill="transparent" 
                          stroke="rgba(255,255,255,0.06)" 
                          strokeWidth="24" 
                        />
                        {/* Progress Fill */}
                        <circle 
                          cx="190" cy="190" r={radius} 
                          fill="transparent" 
                          stroke="url(#progressGradient)" 
                          strokeWidth="24" 
                          strokeDasharray={progress === 100 ? 'none' : circumference} 
                          strokeDashoffset={progress === 100 ? 0 : strokeDashoffset} 
                          strokeLinecap={progress === 100 ? "square" : "round"}
                          style={{ transition: 'stroke-dashoffset 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        />
                    </g>
                </svg>
                <div className="percentage-text" style={{ 
                    fontSize: '84px', 
                    fontWeight: 900, 
                    letterSpacing: '-2.5px',
                    zIndex: 3,
                    color: '#ffffff',
                    textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    transform: progress === 100 ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animation: isActive && progress < 100 ? 'text-glow-pulse 2s infinite alternate' : 'none'
                }}>
                    {progress}%
                </div>
            </div>
        </div>
    </div>
  );
};
