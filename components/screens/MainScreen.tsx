import React, { useState, useRef, useEffect } from 'react';

import { DynamicLogo } from '../DynamicLogo';

interface MainScreenProps {
    onNext: () => void;
    isActive: boolean;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNext, isActive }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragX, setDragX] = useState(0);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const dragStartX = useRef<number>(0);
    const dragStartThumbX = useRef<number>(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    const TRACK_PADDING = 10;

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isUnlocked) return;
        let clientX = 0;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }
        dragStartX.current = clientX;
        dragStartThumbX.current = dragX;
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        if (isUnlocked) return;
        setIsDragging(false);
        setDragX(0);
    };

    useEffect(() => {
        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging || isUnlocked || !trackRef.current) return;

            let clientX = 0;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
            } else {
                clientX = (e as MouseEvent).clientX;
            }

            const trackRect = trackRef.current.getBoundingClientRect();
            const thumbWidth = thumbRef.current ? thumbRef.current.offsetWidth : 360;
            const maxDragX = trackRect.width - thumbWidth - (TRACK_PADDING * 2);

            const dx = clientX - dragStartX.current;
            let newX = dragStartThumbX.current + dx;

            if (newX < 0) newX = 0;
            if (newX > maxDragX) newX = maxDragX;

            setDragX(newX);

            if (newX >= maxDragX * 0.90) {
                setIsUnlocked(true);
                setIsDragging(false);
                setDragX(maxDragX);

                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                setTimeout(() => {
                    onNext();
                    setTimeout(() => {
                        setIsUnlocked(false);
                        setDragX(0);
                    }, 300);
                }, 200);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        } else {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, isUnlocked, onNext]);

    return (
        <div
            className={`screen main-interface-wrap ${isActive ? 'visible' : ''}`}
            style={{ display: isActive ? 'flex' : 'none', position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
        >
            {/* Full Screen Festival Background Layer */}
            <div
                className="festival-bg-layer"
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url('/reva-utsav-bg.png')`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.85, zIndex: 0
                }}
            ></div>
            {/* Dark overlay for contrast */}
            <div className="festival-bg-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(17,0,28,0.95) 0%, rgba(17,0,28,0.6) 50%, rgba(17,0,28,0.3) 100%)', zIndex: 1 }}></div>

            {/* Existing ambient glows */}
            {/* Large Centered Branding Background */}
            <div style={{ position: 'absolute', top: '50%', left: '48%', transform: 'translate(-50%, -50%)', zIndex: 5, pointerEvents: 'none', marginTop: '-130px', marginLeft: '31px' }}>
                <h1 style={{
                    fontSize: '138px',
                    fontWeight: 900,
                    letterSpacing: '10px',
                    margin: 0,
                    background: 'linear-gradient(135deg, #ffffff 0%, #ffaa00 50%, #ff007f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    marginLeft: '13px'
                }}>MIMO</h1>
                <p style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '5px',
                    margin: 0,
                    marginTop: '-3px',
                    textTransform: 'uppercase',
                    textShadow: '0 4px 10px rgba(0,0,0,0.8)'
                }}>
                    <span style={{ color: '#ffffff' }}>SELF-SERVICE</span>{' '}
                    <span style={{ color: '#ffaa00' }}>PRINTING KIOSK</span>
                </p>
            </div>

            <main className="billboard-container" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '30px', transform: 'translateY(-296.5px)' }}>

                {/* Centered Advertisement Content */}
                <section className="poster-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div className="festival-typography" style={{ marginBottom: '5px' }}>
                        <h1 className="fest-title" style={{
                            fontSize: '90px',
                            fontWeight: 900,
                            lineHeight: 1,
                            margin: 0,
                            letterSpacing: '-3px',
                            background: 'linear-gradient(135deg, #ffffff 20%, #ffaa00 60%, #ff007f 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))',
                            whiteSpace: 'nowrap'
                        }}>
                            REVOTHSAVA '26
                        </h1>
                    </div>

                    <div className="fest-dates" style={{ marginTop: '0px' }}>
                        <p className="fest-sub" style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '6px', color: 'rgba(255,255,255,0.8)', marginTop: '0px' }}>THE ULTIMATE INTER-COLLEGIATE SHOWDOWN</p>
                    </div>
                </section>
            </main>



            {/* HORIZONTAL SWIPE TRACK: Absolutely positioned at the bottom to avoid interfering with titles */}
            <section className="kiosk-action-panel" style={{
                position: 'absolute',
                bottom: '152px',
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 100
            }}>
                <div className={`swipe-track-horizontal ${isUnlocked ? 'unlocked' : ''}`} ref={trackRef} style={{
                    width: '680px',
                    height: '90px',
                    background: 'rgba(20, 0, 30, 0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '100px',
                    padding: '6px',
                    position: 'relative',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden'
                }}>
                    {/* Glowing Accent */}
                    <div className="track-glow" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,170,0,0.15), transparent)',
                        animation: 'shimmerSweep 3s infinite linear'
                    }}></div>

                    {/* Progress Fill */}
                    <div className="swipe-fill-horizontal" style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: dragX + 100 + 'px',
                        background: 'linear-gradient(90deg, #ff007f, #ffaa00)',
                        opacity: dragX > 0 ? 0.3 : 0,
                        transition: isDragging ? 'none' : 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        zIndex: 1
                    }}></div>

                    <div className="swipe-hint-arrows" style={{
                        position: 'absolute',
                        left: '78%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '5px',
                        zIndex: 2
                    }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="material-symbols-outlined" style={{
                                color: '#ffaa00',
                                fontSize: '44px',
                                opacity: 0.1,
                                animation: `chevronChase 1.5s infinite ${i * 0.15}s`
                            }}>chevron_right</span>
                        ))}
                    </div>

                    {/* The Swipe Pill (Thumb) */}
                    <div className={`swipe-thumb-pill ${isDragging ? 'dragging' : ''}`} ref={thumbRef}
                        style={{
                            height: '78px',
                            width: '375px',
                            background: '#ffffff',
                            borderRadius: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 8px',
                            cursor: 'grab',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                            transform: `translateX(${dragX}px)`,
                            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                            zIndex: 10,
                            userSelect: 'none'
                        }}
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        {/* Invisible spacer to perfectly center text */}
                        <div style={{ width: '58px', flexShrink: 0 }}></div>
                        
                        <span className="swipe-text" style={{ flex: 1, textAlign: 'center', fontSize: '25px', fontWeight: 900, letterSpacing: '0px', wordSpacing: '9px', color: '#11001c', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                            {isUnlocked ? 'UNLOCKED' : 'SWIPE TO START'}
                        </span>

                        <div className="arrow-circle-white" style={{
                            width: '58px',
                            height: '58px',
                            background: '#f4f4f4',
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: '2px'
                        }}>
                            <span className="material-symbols-outlined" style={{ color: '#ff007f', fontSize: '28px', fontWeight: 'bold' }}>
                                {isUnlocked ? 'check' : 'arrow_forward'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="kiosk-footer" style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, textAlign: 'center', zIndex: 10, padding: 0 }}>
                Software designed and developed by <strong>Rathindra.</strong><br />&copy; 2026 <strong>VisionPrintt</strong>. All rights reserved.
            </footer>

            <style>{`
            .ambient-glow {
                position: absolute;
                width: 600px;
                height: 600px;
                border-radius: 50%;
                filter: blur(20px);
                opacity: 0.4;
                pointer-events: none;
            }
            .glow-1 { background: radial-gradient(circle, #ff007f 0%, transparent 70%); top: -10%; left: -10%; }
            .glow-2 { background: radial-gradient(circle, #ffaa00 0%, transparent 70%); bottom: -10%; right: -10%; }
            .glow-3 { background: radial-gradient(circle, #8000ff 0%, transparent 70%); top: 40%; left: 30%; }

            @keyframes chevronChase {
                0%, 100% { opacity: 0.1; transform: scale(0.9); }
                30% { opacity: 1; transform: scale(1.1); color: #ffaa00; }
                60% { opacity: 0.1; transform: scale(0.9); }
            }
            @keyframes neonPulse {
                0%, 100% { opacity: 0.8; filter: brightness(1); }
                50% { opacity: 1; filter: brightness(1.3); }
            }
            @keyframes shimmerSweepText {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
            }
        `}</style>
        </div>
    );
};
