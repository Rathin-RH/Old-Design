import React, { useEffect, useState, useRef } from 'react';

interface PrintingScreenProps {
  isActive: boolean;
  statusTitle?: string;
  statusSub?: string;
  onComplete: () => void;
  pages?: number;
  duplex?: boolean;
  manualProgress?: number;
}

export const PrintingScreen: React.FC<PrintingScreenProps> = ({ 
  isActive, 
  statusTitle, 
  statusSub, 
  onComplete,
  pages = 1,
  duplex = false,
  manualProgress 
}) => {
  const [progress, setProgress] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSub, setTypedSub] = useState('');
  const intervalRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  // Guard so we only trigger the ejection wait once
  const ejectingRef = useRef(false);

  // Paper ejection buffer — accounts for physical printer mechanics:
  //   Single-sided: 5s base + 3s per extra page, max 25s
  //   Duplex: 20s base + 5s per physical sheet, max 60s
  //   (Duplex reverses paper internally before printing side 2 — takes much longer)
  const physicalSheets = Math.ceil(pages / 2);
  const ejectDelayMs = duplex
    ? Math.min(20000 + (physicalSheets - 1) * 5000, 60000)
    : Math.min(5000 + (pages - 1) * 3000, 25000);

  // Triggered when CUPS reports the job as completed (manualProgress >= 100)
  useEffect(() => {
    if (manualProgress !== undefined && manualProgress >= 100 && isActive && !ejectingRef.current) {
      ejectingRef.current = true;

      // Stop the progress ticker — hold at 99% while paper physically ejects
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Wait for paper to physically come out, then snap to 100% and go to Summary
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      completionTimerRef.current = window.setTimeout(() => {
        setProgress(100);
        completionTimerRef.current = window.setTimeout(() => {
          onComplete();
          completionTimerRef.current = null;
        }, 600);
      }, ejectDelayMs);
    }
  }, [manualProgress, onComplete, isActive, ejectDelayMs]);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setTypedTitle('');
      setTypedSub('');
      ejectingRef.current = false;
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

    // Fixed 15-second loading experience — stops at 99% to wait for CUPS
    if (!intervalRef.current) {
      const totalTime = 15000;
      const stepTime = totalTime / 100;

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             return 100;
          }

          const next = prev + 1;
          if (next >= 99) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             // Hold at 99% — silently waiting for ejection buffer to expire
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
  }, [isActive, statusTitle, statusSub, manualProgress]);

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
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
            
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
                0% { transform: translate(0, 0) scale(0.6) rotate(-10deg); opacity: 0; }
                20% { opacity: 0.9; transform: translate(40px, -25px) scale(0.8) rotate(5deg); }
                80% { opacity: 0.9; transform: translate(120px, -65px) scale(1) rotate(-5deg); }
                100% { transform: translate(160px, -90px) scale(0.6) rotate(15deg); opacity: 0; }
            }
            @keyframes text-glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 15px rgba(52,211,153,0.3)); }
                50% { filter: drop-shadow(0 0 35px rgba(52,211,153,0.7)); }
            }
            .music-particle {
                position: absolute;
                color: rgba(251, 113, 133, 0.8);
                font-size: 52px;
                font-variation-settings: 'FILL' 1;
                filter: drop-shadow(0 4px 12px rgba(251, 113, 133, 0.4));
                animation: float-note 2.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            }
            .particle-2 { animation-delay: 0.9s; top: 15px; font-size: 38px; color: rgba(253, 164, 175, 0.8); }
            .particle-3 { animation-delay: 1.8s; top: -15px; font-size: 46px; }
            
            @keyframes data-stream {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .data-text-highlight {
                background: linear-gradient(90deg, #ffffff 0%, #fb7185 30%, #ffffff 60%);
                background-size: 200% auto;
                color: #fff;
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: data-stream 3s linear infinite;
            }
            .love-message {
                font-family: 'Great Vibes', cursive;
                font-size: 62px;
                color: #fda4af;
                text-shadow: 0 4px 12px rgba(251, 113, 133, 0.4);
                display: flex;
                align-items: center;
                gap: 20px;
                margin-top: -10px;
            }
            .love-note {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 60px;
                color: #f43f5e;
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
                
                <div className="love-message" style={{ marginTop: '40px', opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    <span className="love-note">♪</span>
                    Printing with Love
                    <span className="love-note">♫</span>
                </div>
            </div>
        </div>

        {/* Right Column: Giant Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            
            {/* Musical Notes Flying In (Visual effect) */}
            {isActive && progress < 100 && (
                <div style={{ position: 'absolute', left: '-150px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                    <div className="music-particle">♪</div>
                    <div className="music-particle particle-2">♫</div>
                    <div className="music-particle particle-3">♬</div>
                </div>
            )}

            <div className="circular-progress-container" style={{ position: 'relative', width: '380px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Dynamic Glow Background */}
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: '#fb7185',
                    filter: 'blur(70px)',
                    opacity: 0.15 + (progress / 100) * 0.45,
                    transition: 'opacity 0.3s',
                }} />
                
                {/* Expanding pulse rings */}
                {isActive && progress < 100 && (
                    <>
                        <div style={{
                            position: 'absolute', inset: '45px', borderRadius: '50%', border: '2px solid rgba(251, 113, 133, 0.5)',
                            animation: 'pulse-ring 3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite', pointerEvents: 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute', inset: '45px', borderRadius: '50%', border: '2px solid rgba(251, 113, 133, 0.2)',
                            animation: 'pulse-ring 3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite 1.5s', pointerEvents: 'none'
                        }}></div>
                    </>
                )}

                <svg width="380" height="380" style={{ position: 'absolute', zIndex: 2 }}>
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fda4af" />
                            <stop offset="100%" stopColor="#f43f5e" />
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
