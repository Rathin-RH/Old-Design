import React from 'react';

type DoodleTheme = 'default' | 'reva-utsav' | 'eco';

interface DynamicLogoProps {
    forceTheme?: DoodleTheme;
}

export const DynamicLogo: React.FC<DynamicLogoProps> = ({ forceTheme }) => {
    return (
        <>
            <style>{`
                @import url('https://fonts.cdnfonts.com/css/lovelo');
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                
                @keyframes swayFlower {
                    0%, 100% { transform: rotate(-2deg); }
                    50% { transform: rotate(3deg); }
                }
                .animate-flower-internal {
                    animation: swayFlower 4s ease-in-out infinite;
                    transform-origin: 50.5px 190px;
                }

                @keyframes heartbeatPulse {
                    0%, 100% { transform: scale(1); }
                    10% { transform: scale(1.04); }
                    20% { transform: scale(1); }
                    30% { transform: scale(1.04); }
                    40% { transform: scale(1); }
                }
                .animate-heartbeat-internal {
                    animation: heartbeatPulse 3s ease-in-out infinite;
                    transform-origin: 12px 12.2px;
                }
                .animate-heartbeat-text {
                    animation: heartbeatPulse 3s ease-in-out infinite;
                    transform-origin: 562px 107.2px;
                }
            `}</style>
            <svg
                width="680"
                height="200"
                viewBox="0 0 680 200"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    {/* Vertical gradient: bright white top → soft pink bottom for the M letters */}
                    <linearGradient id="mimoFillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="50%" stopColor="#ffebf0" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ffb3c6" stopOpacity="1" />
                    </linearGradient>

                    {/* Gradient for the Big Heart (O) and Tulip Head */}
                    <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff7eb3" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ff758c" stopOpacity="1" />
                    </linearGradient>

                    {/* Gradient for the Tulip Stem and Leaves */}
                    <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#9ccc65" stopOpacity="1" />
                        <stop offset="100%" stopColor="#7cb342" stopOpacity="1" />
                    </linearGradient>
                    
                    {/* Gradient for the tiny floating purple heart */}
                    <linearGradient id="purpleHeartGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#b86898" stopOpacity="1" />
                        <stop offset="100%" stopColor="#9e5281" stopOpacity="1" />
                    </linearGradient>

                    {/* Bevel highlight gradient (top-left shine) */}
                    <linearGradient id="mimoBevelHighlight" x1="0" y1="0" x2="0.3" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>

                    {/* Glowing drop shadow for text to blend perfectly with the screen's ambient light */}
                    <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ffb3c6" floodOpacity="0.8" />
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
                    </filter>

                    {/* Radiant golden glow for the halo */}
                    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FFD700" floodOpacity="0.8" />
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
                    </filter>

                    {/* Drop shadow filter */}
                    <filter id="mimoShadow" x="-10%" y="-10%" width="130%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(120,20,50,0.45)" />
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(120,20,50,0.25)" />
                    </filter>

                    {/* Tight drop shadow for inner heart text */}
                    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(120, 20, 50, 0.4)" />
                    </filter>

                    {/* Standard M letters - perfectly centered using textAnchor */}
                    <text id="standardM1" x="125" y="170" textAnchor="middle" fontFamily="'Lovelo', sans-serif" fontSize="200" fontWeight="900">M</text>
                    <text id="standardM2" x="405" y="170" textAnchor="middle" fontFamily="'Lovelo', sans-serif" fontSize="200" fontWeight="900">M</text>
                    
                    {/* The Mother & Child 'M' Shape */}
                    <g id="motherChildM1" transform="translate(46, 5) scale(0.85)">
                        <circle cx="135" cy="15" r="24" />
                        <circle cx="60" cy="50" r="16" />
                        <path d="M 75 150 C 95 110, 115 50, 145 50 C 175 50, 195 130, 185 180 C 180 190, 155 190, 155 180 C 165 135, 145 75, 130 75 C 110 75, 95 115, 75 150 Z" />
                        <path d="M 20 180 C 10 130, 40 90, 75 90 C 105 90, 130 120, 145 150 C 130 130, 110 115, 85 115 C 60 115, 45 150, 45 180 C 45 190, 20 190, 20 180 Z" />
                    </g>

                    {/* Tulip shadow layer */}
                    <g id="mothersDayI_shadow" transform="translate(220, 5) scale(0.85)">
                        <g className="animate-flower-internal">
                            <path d="M 45 90 Q 40 140, 44 180 C 45 190, 55 190, 56 180 Q 52 140, 57 90 Z" />
                            <path d="M 42 115 Q 15 90, -5 75 Q 15 115, 43 130 Z" />
                            <path d="M 55 135 Q 85 110, 110 100 Q 85 135, 54 150 Z" />
                            <path d="M 10 20 C -5 60, 20 95, 50 95 C 80 95, 105 60, 90 20 C 80 50, 65 50, 50 35 C 35 50, 20 50, 10 20 Z" />
                        </g>
                    </g>

                    {/* Tulip colored layer */}
                    <g id="mothersDayI_colored" transform="translate(220, 5) scale(0.85)">
                        <g className="animate-flower-internal">
                            <g fill="url(#stemGrad)">
                                <path d="M 45 90 Q 40 140, 44 180 C 45 190, 55 190, 56 180 Q 52 140, 57 90 Z" />
                                <path d="M 42 115 Q 15 90, -5 75 Q 15 115, 43 130 Z" />
                                <path d="M 55 135 Q 85 110, 110 100 Q 85 135, 54 150 Z" />
                            </g>
                            <path fill="url(#heartGrad)" d="M 10 20 C -5 60, 20 95, 50 95 C 80 95, 105 60, 90 20 C 80 50, 65 50, 50 35 C 35 50, 20 50, 10 20 Z" />
                        </g>
                    </g>

                    {/* Tulip highlight layer (only the flower head to prevent disjointed stem) */}
                    <g id="mothersDayI_highlight" transform="translate(220, 5) scale(0.85)">
                        <g className="animate-flower-internal">
                            <path d="M 10 20 C -5 60, 20 95, 50 95 C 80 95, 105 60, 90 20 C 80 50, 65 50, 50 35 C 35 50, 20 50, 10 20 Z" />
                        </g>
                    </g>

                    {/* Heart shadow layer */}
                    <g id="heartO" transform="translate(472, 16) scale(7.5)">
                        <g className="animate-heartbeat-internal">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </g>
                    </g>

                    {/* Heart colored layer with glossy highlight */}
                    <g id="heartO_colored" transform="translate(472, 16) scale(7.5)">
                        <g className="animate-heartbeat-internal">
                            <path fill="url(#heartGrad)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            <path fill="rgba(255,255,255,0.6)" d="M 4.5 8 C 4.5 5 6.5 3 8.5 3 C 6.5 4 5.5 6 5.5 8 C 5.5 9 6 10 6.5 10.5 C 5 9.5 4.5 8.5 4.5 8 Z" />
                        </g>
                    </g>
                </defs>

                {/* Main MIMO Wordmark Group - Scaled down 80% and shifted up safely from baseline */}
                <g transform="translate(340, 134) scale(0.8) translate(-340, -170)">
                    {/* Layer 1: Deep shadow offset (gives 3D depth) */}
                    <g transform="translate(4, 6)">
                        <use href="#motherChildM1" fill="rgba(130, 20, 50, 0.45)" />
                        <use href="#mothersDayI_shadow" fill="rgba(130, 20, 50, 0.45)" />
                        <use href="#standardM2" fill="rgba(130, 20, 50, 0.45)" />
                        <use href="#heartO" fill="rgba(130, 20, 50, 0.45)" />
                    </g>

                    {/* Layer 2: Mid shadow (bevel bottom-right edge) */}
                    <g transform="translate(2, 3)">
                        <use href="#motherChildM1" fill="rgba(180, 40, 80, 0.3)" />
                        <use href="#mothersDayI_shadow" fill="rgba(180, 40, 80, 0.3)" />
                        <use href="#standardM2" fill="rgba(180, 40, 80, 0.3)" />
                        <use href="#heartO" fill="rgba(180, 40, 80, 0.3)" />
                    </g>

                    {/* Layer 3: Main text with gradient fill + drop shadow */}
                    <g filter="url(#mimoShadow)">
                        <use href="#motherChildM1" fill="url(#mimoFillGrad)" />
                        <use href="#mothersDayI_colored" />
                        <use href="#standardM2" fill="url(#mimoFillGrad)" />
                        <use href="#heartO_colored" />
                    </g>

                    {/* Layer 4: Top-edge highlight shine (bevel top) */}
                    <g>
                        <use href="#motherChildM1" fill="none" stroke="url(#mimoBevelHighlight)" strokeWidth="1.5" />
                        <use href="#mothersDayI_highlight" fill="none" stroke="url(#mimoBevelHighlight)" strokeWidth="1.5" />
                        <use href="#standardM2" fill="none" stroke="url(#mimoBevelHighlight)" strokeWidth="1.5" />
                        <use href="#heartO" fill="none" stroke="url(#mimoBevelHighlight)" strokeWidth="1.5" />
                    </g>

                    {/* Decorations for Mother & Child M (Halo and Sparkles) */}
                    <g transform="translate(46, 5) scale(0.85)">
                        {/* Golden Halo over Mother's head */}
                        <g filter="url(#goldGlow)">
                            <ellipse cx="135" cy="-18" rx="16" ry="5" fill="none" stroke="#FFDF00" strokeWidth="3" transform="rotate(-10 135 -18)" />
                            {/* Halo highlight for 3D glassy feel */}
                            <ellipse cx="135" cy="-19" rx="14" ry="3" fill="none" stroke="#ffffff" strokeWidth="1" transform="rotate(-10 135 -18)" opacity="0.8" />
                        </g>

                        {/* Large Sparkle between heads */}
                        <g filter="url(#textGlow)">
                            <path d="M 80 -7 Q 80 5 92 5 Q 80 5 80 17 Q 80 5 68 5 Q 80 5 80 -7 Z" fill="#ffffff" />
                        </g>
                        
                        {/* Small Sparkle on the right */}
                        <g filter="url(#textGlow)" opacity="0.8">
                            <path d="M 175 14 Q 175 20 181 20 Q 175 20 175 26 Q 175 20 169 20 Q 175 20 175 14 Z" fill="#ffffff" />
                        </g>
                    </g>

                    {/* Inner text for the Heart (scales beautifully with MIMO) */}
                    <g filter="url(#textGlow)">
                        <text className="animate-heartbeat-text" x="562" textAnchor="middle" fontFamily="'Dancing Script', cursive" fontWeight="700" fill="#ffffff">
                            <tspan x="562" y="90" fontSize="28">Love you</tspan>
                            <tspan x="562" y="125" fontSize="34">Mom</tspan>
                        </text>
                    </g>

                </g>

                {/* Text centered gracefully below the logo with elegant decorations */}
                <g filter="url(#textGlow)">
                    {/* Left decorative tiny heart */}
                    <g transform="translate(145, 160) scale(0.7) rotate(-20)">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGrad)" />
                    </g>
                    
                    {/* Right decorative tiny heart */}
                    <g transform="translate(515, 165) scale(0.5) rotate(15)">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGrad)" />
                    </g>

                    <text x="340" y="184" textAnchor="middle" fontFamily="'Dancing Script', cursive" fontWeight="700" fontSize="34" fill="url(#mimoFillGrad)" letterSpacing="1">
                        Happy Mother's Day
                    </text>

                    {/* Delicate curved underline swash */}
                    <path d="M 230 194 Q 340 198, 450 194" fill="none" stroke="url(#mimoFillGrad)" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </svg>
        </>
    );
};

