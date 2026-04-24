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

  // Sync with manualProgress if provided and force instant bypass when done
  useEffect(() => {
    if (manualProgress !== undefined) {
      setProgress(p => Math.max(p, manualProgress));
      if (manualProgress >= 100 && isActive) {
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
        completionTimerRef.current = window.setTimeout(() => {
          onComplete();
          completionTimerRef.current = null;
        }, 50); // Near instantly bypass the "Completed" screen and transition to Summary
      }
    }
  }, [manualProgress, onComplete, isActive]);

  // Synchronized Interpolated Ticker matching physical hardware speeds perfectly
  useEffect(() => {
    if (!isActive || manualProgress === undefined || manualProgress >= 100) return;
    
    // Exactly matches backend: ~2.5 seconds per page
    const totalMs = Math.max(pages * 2500, 5000); 
    const stepMs = totalMs / 98; // Distribute purely so it hits 98% smoothly
    
    const ticker = window.setInterval(() => {
      setProgress(p => {
        if (p < 98) return p + 1;
        return p;
      });
    }, stepMs);

    return () => clearInterval(ticker);
  }, [isActive, manualProgress, pages]);

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

    // Dynamic Mock Loop (only if manualProgress is not being used)
    if (!intervalRef.current && manualProgress === undefined) {
      // Laser printer estimation: ~2.5 seconds per page
      const speedPerPage = 2500; 
      const totalTime = pages * speedPerPage;
      const stepTime = totalTime / 100;

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          if (next >= 100) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             completionTimerRef.current = window.setTimeout(() => {
                onComplete();
                completionTimerRef.current = null;
             }, 1500);
             return 100;
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
            @keyframes spin-slow {
                100% { transform: rotate(360deg); }
            }
            @keyframes spin-slow-reverse {
                100% { transform: rotate(-360deg); }
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.85); opacity: 0; }
                50% { opacity: 0.8; }
                100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes float-note {
                0% { transform: translate(0, 0) scale(0.5) rotate(-15deg); opacity: 0; }
                50% { opacity: 0.9; transform: translate(60px, -60px) scale(1.2) rotate(15deg); }
                100% { transform: translate(120px, -120px) scale(0.6) rotate(45deg); opacity: 0; }
            }
            @keyframes text-glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 15px rgba(0, 212, 240, 0.6)); }
                50% { filter: drop-shadow(0 0 35px rgba(255, 224, 0, 0.8)); }
            }
            .printing-particle {
                position: absolute;
                font-size: 38px;
                font-weight: bold;
                animation: float-note 2.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                text-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            .particle-1 { color: #FFE000; left: -20px; }
            .particle-2 { color: #00D4F0; top: 30px; left: 40px; font-size: 50px; animation-delay: 0.8s; }
            .particle-3 { color: #FF2D78; top: -20px; left: 80px; font-size: 32px; animation-delay: 1.6s; }
            
            @keyframes data-stream {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .data-text-highlight {
                background: linear-gradient(90deg, #FFE000 0%, #FF8C00 33%, #FF2D78 66%, #FFFFFF 100%);
                background-size: 200% auto;
                color: #fff;
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: data-stream 3s linear infinite;
            }
        `}</style>

        {/* Left Column: Context & Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '30px', flex: 1, textAlign: 'left', maxWidth: '750px', zIndex: 10 }}>
            <div style={{ minHeight: '180px' }}>
                <h2 style={{ fontSize: '92px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-3px', lineHeight: '1.05', display: 'flex' }}>
                    <span className={isActive ? "data-text-highlight" : ""}>{typedTitle}</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '36px', fontWeight: 500, lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                    {typedSub}
                </p>
            </div>
        </div>

        {/* Right Column: Giant Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            
            {/* Floating Music Notes for Reva Utsav */}
            {isActive && progress < 100 && (
                <div style={{ position: 'absolute', left: '-120px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                    <div className="printing-particle particle-1">♫</div>
                    <div className="printing-particle particle-2">♪</div>
                    <div className="printing-particle particle-3">✦</div>
                </div>
            )}

            <div className="circular-progress-container" style={{ position: 'relative', width: '380px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Dynamic Glow Background (Reva Utsav DJ Vibes) */}
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 212, 240, 0.45) 0%, rgba(0, 212, 240, 0) 70%)',
                    filter: 'blur(50px)',
                    opacity: 0.15 + (progress / 100) * 0.45,
                    transition: 'opacity 0.3s',
                }} />
                
                {/* Expanding pulse rings */}
                {isActive && progress < 100 && (
                    <>
                        <div style={{
                            position: 'absolute', inset: '25px', borderRadius: '50%', border: '3px solid rgba(0, 212, 240, 0.6)',
                            animation: 'pulse-ring 2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite', pointerEvents: 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute', inset: '25px', borderRadius: '50%', border: '4px solid rgba(255, 45, 120, 0.5)',
                            animation: 'pulse-ring 2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite 1s', pointerEvents: 'none'
                        }}></div>
                    </>
                )}

                <svg width="380" height="380" style={{ position: 'absolute', zIndex: 2 }}>
                    <defs>
                        <linearGradient id="revaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFE000" />
                            <stop offset="50%" stopColor="#FF2D78" />
                            <stop offset="100%" stopColor="#00D4F0" />
                        </linearGradient>
                    </defs>

                    {/* Outer Audio Equalizer Bars */}
                    <g style={{ transformOrigin: 'center', animation: isActive ? 'spin-slow 16s linear infinite' : 'none' }}>
                        <circle cx="190" cy="190" r="174" fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="16" strokeDasharray="6 26" strokeLinecap="round" />
                    </g>
                    
                    {/* Inner DJ Vinyl Groove Ring */}
                    <g style={{ transformOrigin: 'center', animation: isActive ? 'spin-slow-reverse 12s linear infinite' : 'none' }}>
                        <circle cx="190" cy="190" r="105" fill="transparent" stroke="#FFE000" strokeWidth="4" strokeDasharray="2 18" strokeLinecap="round" opacity="0.6"/>
                        <circle cx="190" cy="190" r="85" fill="transparent" stroke="#00D4F0" strokeWidth="2" strokeDasharray="10 30" opacity="0.4"/>
                    </g>

                    <g style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                        {/* Background Track */}
                        <circle 
                          cx="190" cy="190" r={radius} 
                          fill="transparent" 
                          stroke="rgba(255,255,255,0.06)" 
                          strokeWidth="28" 
                        />
                        {/* Audio Progress Fill - Segmented */}
                        <circle 
                          cx="190" cy="190" r={radius} 
                          fill="transparent" 
                          stroke="url(#revaGradient)" 
                          strokeWidth="28" 
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
