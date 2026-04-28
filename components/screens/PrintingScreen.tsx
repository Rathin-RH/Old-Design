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

    // Dynamic Mock Loop: Always run visually for a smooth experience
    if (!intervalRef.current) {
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
            width: '100%',
            height: '100%',
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '100px', 
            padding: '0 100px',
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 10% 10%, rgba(255, 170, 0, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(255, 0, 127, 0.08) 0%, transparent 40%)'
        }}
    >
        {/* Ambient Glow Blobs */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,170,0,0.1) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,0,127,0.1) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

        <style>{`
            @keyframes spin-slow {
                100% { transform: rotate(360deg); }
            }
            @keyframes spin-slow-reverse {
                100% { transform: rotate(-360deg); }
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.85); opacity: 0; }
                50% { opacity: 0.6; }
                100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes soundwave-expand {
                0% { transform: scale(1); opacity: 0.6; border-width: 4px; }
                100% { transform: scale(1.6); opacity: 0; border-width: 1px; }
            }
            @keyframes text-glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 15px rgba(255,170,0,0.3)); }
                50% { filter: drop-shadow(0 0 35px rgba(255,0,127,0.6)); }
            }
            @keyframes dance {
                0%, 100% { transform: scaleY(1); opacity: 0.6; }
                50% { transform: scaleY(1.8); opacity: 1; }
            }
            .soundwave-ring {
                position: absolute;
                inset: -20px;
                border: 2px solid rgba(255, 170, 0, 0.4);
                border-radius: 50%;
                animation: soundwave-expand 2s cubic-bezier(0.2, 0.4, 0.4, 1) infinite;
                pointer-events: none;
                z-index: 0;
            }
            .wave-2 { animation-delay: 0.6s; border-color: rgba(255, 0, 127, 0.3); }
            .wave-3 { animation-delay: 1.2s; border-color: rgba(138, 43, 226, 0.2); }
            
            @keyframes data-stream {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .data-text-highlight {
                background: linear-gradient(135deg, #ffffff 0%, #ffaa00 50%, #ff007f 100%);
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
                <h2 style={{ 
                    fontSize: '92px', 
                    fontWeight: 900, 
                    marginBottom: '20px', 
                    letterSpacing: '-3px', 
                    lineHeight: '1.05', 
                    display: 'flex',
                    textShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    <span className={isActive ? "data-text-highlight" : ""}>{typedTitle}</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '36px', fontWeight: 600, lineHeight: '1.4', whiteSpace: 'pre-line', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    {typedSub}
                </p>
            </div>
        </div>

        {/* Right Column: Giant Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            
            {/* Soundwave concentric rings radiating from center */}
            {isActive && progress < 100 && (
                <>
                    <div className="soundwave-ring"></div>
                    <div className="soundwave-ring wave-2"></div>
                    <div className="soundwave-ring wave-3"></div>
                </>
            )}

            <div className="circular-progress-container" style={{ position: 'relative', width: '420px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Dynamic Glow Background */}
                <div style={{
                    position: 'absolute',
                    width: '320px',
                    height: '320px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #ffaa00 0%, #ff007f 100%)',
                    filter: 'blur(20px)',
                    opacity: 0.1 + (progress / 100) * 0.4,
                    transition: 'opacity 0.3s',
                }} />
                
                {/* Expanding pulse rings */}
                {isActive && progress < 100 && (
                    <>
                        <div style={{
                            position: 'absolute', inset: '45px', borderRadius: '50%', border: '2px solid rgba(255, 170, 0, 0.4)',
                            animation: 'pulse-ring 3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite', pointerEvents: 'none'
                        }}></div>
                    </>
                )}

                {/* Background Track for the radial bars */}
                <div style={{
                    position: 'absolute',
                    width: '320px',
                    height: '320px',
                    borderRadius: '50%',
                    border: '6px solid rgba(255, 255, 255, 0.03)',
                    zIndex: 1
                }} />

                {/* Music Visualizer Radial Bars */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2 }}>
                    {[...Array(60)].map((_, i) => {
                        const angle = (i / 60) * 360;
                        const isReached = (i / 60) * 100 <= progress;
                        return (
                            <div 
                                key={i} 
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '6px',
                                    height: '25px',
                                    transformOrigin: '50% -155px',
                                    transform: `translate(-50%, 155px) rotate(${angle}deg)`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: isReached ? `linear-gradient(to top, #ffaa00, #ff007f)` : 'rgba(255,255,255,0.03)',
                                    borderRadius: '4px',
                                    animation: isActive && isReached ? `dance ${0.4 + (i % 7) * 0.1}s ease-in-out infinite alternate` : 'none',
                                    animationDelay: `${(i % 13) * 0.15}s`,
                                    boxShadow: isReached ? '0 0 20px rgba(255,0,127,0.6)' : 'none',
                                    transformOrigin: 'center bottom'
                                }} />
                            </div>
                        );
                    })}
                </div>

                {/* Inner Rotating decorative ring */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    height: '280px',
                    borderRadius: '50%',
                    border: '2px dashed rgba(255,255,255,0.1)',
                    animation: 'spin-slow 20s linear infinite',
                    zIndex: 1
                }} />

                <div className="percentage-text" style={{ 
                    fontSize: '94px', 
                    fontWeight: 900, 
                    letterSpacing: '-3px',
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
