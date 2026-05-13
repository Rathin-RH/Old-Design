import React from 'react';
import { EcoMimoDoodle } from './doodles/EcoMimoDoodle';
import { RevaUtsavDoodle } from './doodles/RevaUtsavDoodle';

type DoodleTheme = 'default' | 'reva-utsav' | 'eco';

interface DynamicLogoProps {
    forceTheme?: DoodleTheme;
}

export const DynamicLogo: React.FC<DynamicLogoProps> = ({ forceTheme }) => {
    const activeTheme: DoodleTheme = forceTheme || 'default';

    if (activeTheme === 'reva-utsav') {
        return <RevaUtsavDoodle />;
    }

    if (activeTheme === 'eco') {
        return <EcoMimoDoodle />;
    }

    // Default: Lovelo wordmark — vibrant gradient + moving shine
    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <style>{`
                @import url('https://fonts.cdnfonts.com/css/lovelo');

                /* ── Entrance: fade up & scale in ─────────────────────── */
                .mimo-logo-wrap {
                    animation: mimoFadeIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
                    overflow: visible;
                }

                @keyframes mimoFadeIn {
                    0%   { opacity: 0; transform: translateY(20px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0px)  scale(1);    }
                }

                /* ── Shine streak: slow diagonal wipe left-to-right ─────── */
                /* 0%→72% = the actual sweep across; 72%→100% = pause hold   */
                @keyframes mimShineMove {
                    0%   { x: -750px; }
                    72%  { x:  750px; }
                    100% { x:  750px; }
                }

                .mimo-shine-rect {
                    animation: mimShineMove 5.5s ease-in-out infinite;
                    animation-delay: 0.8s;
                }
            `}</style>

            <svg
                className="mimo-logo-wrap"
                width="700"
                height="185"
                viewBox="0 0 700 185"
                style={{ overflow: 'visible', filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.55))' }}
            >
                <defs>
                    {/* ── 1. Main white gradient: top → bottom ── */}
                    <linearGradient id="mimoColorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"   />
                        <stop offset="65%"  stopColor="#dff0ff" stopOpacity="0.97" />
                        <stop offset="100%" stopColor="#b8d8f8" stopOpacity="0.88" />
                    </linearGradient>

                    {/* ── 2. Top-bevel sheen: vertical white fade ── */}
                    <linearGradient id="mimoBevel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="rgba(255,255,255,0.60)" />
                        <stop offset="45%"  stopColor="rgba(255,255,255,0.08)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
                    </linearGradient>

                    {/* ── 3. Animated shine streak gradient ── */}
                    <linearGradient id="mimoShine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="rgba(255,255,255,0)"    />
                        <stop offset="30%"  stopColor="rgba(255,255,255,0)"    />
                        <stop offset="45%"  stopColor="rgba(255,255,255,0.50)" />
                        <stop offset="50%"  stopColor="rgba(255,255,255,0.82)" />
                        <stop offset="55%"  stopColor="rgba(255,255,255,0.50)" />
                        <stop offset="70%"  stopColor="rgba(255,255,255,0)"    />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
                    </linearGradient>

                    {/* ── 4. Clip path — restricts shine to letter shapes ── */}
                    <clipPath id="mimoClip">
                        <text
                            x="50%" y="52%"
                            dominantBaseline="middle"
                            textAnchor="middle"
                            style={{
                                fontFamily: "'Lovelo', 'Arial Black', sans-serif",
                                fontSize: '158px',
                                fontWeight: 900,
                                letterSpacing: '14px',
                            }}
                        >
                            MIMO
                        </text>
                    </clipPath>
                </defs>

                {/* ── Layer 0: deep shadow clone ── */}
                <text
                    x="50%" y="53%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="rgba(0,0,0,0.28)"
                    dx="4" dy="8"
                    style={{
                        fontFamily: "'Lovelo', 'Arial Black', sans-serif",
                        fontSize: '158px',
                        fontWeight: 900,
                        letterSpacing: '14px',
                    }}
                >
                    MIMO
                </text>

                {/* ── Layer 1: clean white gradient fill ── */}
                <text
                    x="50%" y="52%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="url(#mimoColorGrad)"
                    stroke="rgba(255,255,255,0.20)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{
                        fontFamily: "'Lovelo', 'Arial Black', sans-serif",
                        fontSize: '158px',
                        fontWeight: 900,
                        letterSpacing: '14px',
                        paintOrder: 'stroke fill',
                    }}
                >
                    MIMO
                </text>

                {/* ── Layer 2: top-bevel white sheen ── */}
                <text
                    x="50%" y="52%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="url(#mimoBevel)"
                    style={{
                        fontFamily: "'Lovelo', 'Arial Black', sans-serif",
                        fontSize: '158px',
                        fontWeight: 900,
                        letterSpacing: '14px',
                        pointerEvents: 'none',
                    }}
                >
                    MIMO
                </text>

                {/* ── Layer 3: animated shine streak (clipped to text shape) ── */}
                <g clipPath="url(#mimoClip)">
                    <rect
                        className="mimo-shine-rect"
                        x="-750"
                        y="-30"
                        width="400"
                        height="240"
                        fill="url(#mimoShine)"
                        transform="rotate(-18, 350, 92)"
                        style={{ pointerEvents: 'none' }}
                    />
                </g>
            </svg>
        </div>
    );
};
