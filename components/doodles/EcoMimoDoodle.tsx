import React from 'react';

export const EcoMimoDoodle: React.FC = () => {
    return (
        <div className="eco-mimo-container" style={{ position: 'relative', width: '780px', height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
                
                .eco-text-container {
                    position: relative;
                    font-family: 'Fredoka One', cursive;
                    font-size: 160px;
                    letter-spacing: 15px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }

                .mim-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .eco-text-base {
                    position: absolute;
                    color: #2e5c1e;
                    transform: translateY(12px) scaleY(1.05);
                    /* Static text-shadow is relatively cheap */
                    text-shadow: 
                        0 15px 25px rgba(0,0,0,0.6),
                        0 5px 10px rgba(0,0,0,0.4);
                }

                .eco-text-mid {
                    position: absolute;
                    color: #44802c;
                    transform: translateY(6px);
                }

                .eco-text-top {
                    position: relative;
                    color: #65a30d;
                    background: linear-gradient(180deg, #84cc16 0%, #4d7c0f 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    /* Removed expensive drop-shadow filter here to save GPU */
                }

                .eco-text-texture {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-image: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1" fill="rgba(0,0,0,0.05)"/><circle cx="10" cy="12" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="16" cy="6" r="1.5" fill="rgba(0,0,0,0.03)"/></svg>');
                    mix-blend-mode: multiply;
                    pointer-events: none;
                    -webkit-background-clip: text;
                    color: transparent;
                }

                .printer-o {
                    z-index: 10;
                    transform: translateY(15px);
                    animation: subtle-bounce 4s ease-in-out infinite alternate;
                    will-change: transform; /* Hardware acceleration */
                }

                .printer-paper {
                    animation: print-feed 3s ease-in-out infinite alternate;
                    will-change: transform;
                }

                .vine {
                    position: absolute;
                    z-index: 20;
                    transform-origin: top center;
                }

                .flower {
                    position: absolute;
                    animation: float-flower 4s ease-in-out infinite alternate;
                    z-index: 25;
                    will-change: transform;
                }

                .floating-leaf {
                    position: absolute;
                    animation: float-leaf 8s ease-in-out infinite alternate;
                    z-index: 5;
                    will-change: transform;
                }

                .sparkle {
                    position: absolute;
                    animation: twinkle 2s ease-in-out infinite alternate;
                    z-index: 5;
                    will-change: transform, opacity;
                }

                @keyframes sway {
                    0% { transform: rotate(-3deg); }
                    100% { transform: rotate(3deg); }
                }

                @keyframes float-flower {
                    0% { transform: translateY(0px) rotate(0deg) scale(1); }
                    100% { transform: translateY(-5px) rotate(5deg) scale(1.05); }
                }

                @keyframes float-leaf {
                    0% { transform: translateY(0px) rotate(0deg) translateX(0px); }
                    100% { transform: translateY(-40px) rotate(20deg) translateX(15px); }
                }

                @keyframes twinkle {
                    0% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
                    100% { opacity: 1; transform: scale(1.2) rotate(45deg); }
                }

                @keyframes print-feed {
                    0% { transform: translateY(-5px) scaleY(0.95); }
                    100% { transform: translateY(5px) scaleY(1.05); }
                }

                @keyframes subtle-bounce {
                    0% { transform: translateY(15px); }
                    100% { transform: translateY(10px); }
                }
            `}</style>

            {/* Floating Detailed Leaves */}
            <svg className="floating-leaf" style={{ top: '80px', left: '10px', animationDelay: '0s' }} width="30" height="30" viewBox="0 0 40 40">
                <path d="M 0 20 C 10 0, 30 0, 40 20 C 30 40, 10 40, 0 20 Z" fill="#84cc16" />
                <path d="M 0 20 C 10 10, 30 10, 40 20" fill="none" stroke="#4d7c0f" strokeWidth="2" />
            </svg>
            <svg className="floating-leaf" style={{ top: '20px', left: '260px', animationDelay: '2s' }} width="25" height="25" viewBox="0 0 40 40">
                <path d="M 0 20 C 10 0, 30 0, 40 20 C 30 40, 10 40, 0 20 Z" fill="#65a30d" />
                <path d="M 0 20 C 10 10, 30 10, 40 20" fill="none" stroke="#3f6212" strokeWidth="2" />
            </svg>
            <svg className="floating-leaf" style={{ top: '150px', right: '40px', animationDelay: '4s' }} width="35" height="35" viewBox="0 0 40 40">
                <path d="M 0 20 C 10 0, 30 0, 40 20 C 30 40, 10 40, 0 20 Z" fill="#a3e635" />
                <path d="M 0 20 C 10 10, 30 10, 40 20" fill="none" stroke="#4d7c0f" strokeWidth="2" />
            </svg>

            {/* Sparkles / Stars behind */}
            <svg className="sparkle" style={{ top: '10px', left: '120px', animationDelay: '0s' }} width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#FCD34D"/></svg>
            <svg className="sparkle" style={{ top: '160px', left: '50px', animationDelay: '0.5s' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#FCD34D"/></svg>
            <svg className="sparkle" style={{ top: '30px', right: '150px', animationDelay: '1s' }} width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#FCD34D"/></svg>
            <svg className="sparkle" style={{ bottom: '40px', right: '200px', animationDelay: '1.5s' }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#FCD34D"/></svg>

            <div className="eco-text-container">
                {/* 3D Clay Text for MIM */}
                <div className="mim-wrapper">
                    <div className="eco-text-base">
                        <span>M</span><span style={{ marginLeft: '2px' }}>I</span><span style={{ marginLeft: '18px' }}>M</span>
                    </div>
                    <div className="eco-text-mid">
                        <span>M</span><span style={{ marginLeft: '2px' }}>I</span><span style={{ marginLeft: '18px' }}>M</span>
                    </div>
                    <div className="eco-text-top">
                        <span>M</span><span style={{ marginLeft: '2px' }}>I</span><span style={{ marginLeft: '18px' }}>M</span>
                    </div>
                    <div className="eco-text-texture">
                        <span>M</span><span style={{ marginLeft: '2px' }}>I</span><span style={{ marginLeft: '18px' }}>M</span>
                    </div>
                    
                    {/* Vines and Leaves Intertwined */}
                    {/* Sleek Elegant Vines (Bails) */}
                    
                    {/* Left M Vine (Mirrored from Right M) */}
                    <svg className="vine" style={{ left: '-10px', top: '35px', transform: 'scaleX(-1)' }} width="80" height="150" viewBox="0 0 80 150" fill="none">
                        <path d="M 30 0 Q 70 50 40 100 Q 20 120 40 135" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinecap="round" fill="none" transform="translate(-3, 4)" />
                        <path d="M 30 0 Q 70 50 40 100 Q 20 120 40 135" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                        
                        <g transform="translate(48, 35) rotate(50) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                        <g transform="translate(46, 85) rotate(-60) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                        <g transform="translate(40, 135) rotate(40) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                    </svg>

                    {/* Right M Vine */}
                    <svg className="vine" style={{ right: '-10px', top: '35px' }} width="80" height="150" viewBox="0 0 80 150" fill="none">
                        <path d="M 30 0 Q 70 50 40 100 Q 20 120 40 135" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinecap="round" fill="none" transform="translate(3, 4)" />
                        <path d="M 30 0 Q 70 50 40 100 Q 20 120 40 135" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                        
                        <g transform="translate(48, 35) rotate(50) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                        <g transform="translate(46, 85) rotate(-60) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                        <g transform="translate(40, 135) rotate(40) scale(0.7)">
                            <path d="M 0 0 C -15 -15, -15 -30, 0 -30 C 15 -30, 15 -15, 0 0 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#166534" strokeWidth="2" />
                        </g>
                    </svg>



                    {/* 3D Pink Flowers (like in the image) */}
                    <svg className="flower" style={{ left: '28px', top: '20px', animationDelay: '0s' }} width="50" height="50" viewBox="0 0 100 100">
                        <circle cx="50" cy="20" r="20" fill="#fb7185" />
                        <circle cx="80" cy="50" r="20" fill="#f43f5e" />
                        <circle cx="50" cy="80" r="20" fill="#e11d48" />
                        <circle cx="20" cy="50" r="20" fill="#f43f5e" />
                        <circle cx="50" cy="50" r="15" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
                    </svg>

                    <svg className="flower" style={{ right: '28px', top: '20px', animationDelay: '1.2s' }} width="50" height="50" viewBox="0 0 100 100">
                        <circle cx="50" cy="20" r="20" fill="#fb7185" />
                        <circle cx="80" cy="50" r="20" fill="#f43f5e" />
                        <circle cx="50" cy="80" r="20" fill="#e11d48" />
                        <circle cx="20" cy="50" r="20" fill="#f43f5e" />
                        <circle cx="50" cy="50" r="15" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
                    </svg>
                </div>

                {/* Cute Detailed 3D Printer Acting as 'O' */}
                <div style={{ position: 'relative' }}>
                    <svg width="190" height="190" viewBox="0 0 180 180" className="printer-o">
                        {/* Top Paper Stack feeding in */}
                        <path d="M 60 10 L 120 10 L 110 40 L 70 40 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
                        <path d="M 65 5 L 115 5 L 105 40 L 75 40 Z" fill="#ffffff" stroke="#9ca3af" strokeWidth="2" style={{ transform: 'rotate(-3deg)', transformOrigin: 'bottom center' }}/>

                        {/* Main Body Bottom Shadow */}
                        <rect x="20" y="40" width="140" height="110" rx="20" fill="#44403c" />
                        {/* Main Body */}
                        <rect x="20" y="30" width="140" height="110" rx="20" fill="#78716c" />
                        {/* Body Top Highlight */}
                        <rect x="25" y="35" width="130" height="20" rx="10" fill="#a8a29e" opacity="0.4" />

                        {/* Screen Border */}
                        <rect x="35" y="55" width="110" height="60" rx="15" fill="#1c1917" />
                        {/* Screen Inner Display */}
                        <rect x="40" y="60" width="100" height="50" rx="10" fill="#fef08a" />
                        {/* Screen Glow */}
                        <rect x="42" y="62" width="96" height="20" rx="8" fill="#ffffff" opacity="0.3" />
                        
                        {/* Cute Face */}
                        {/* Left Eye */}
                        <circle cx="65" cy="80" r="6" fill="#292524" />
                        <circle cx="67" cy="78" r="2" fill="#ffffff" />
                        
                        {/* Right Eye */}
                        <circle cx="115" cy="80" r="6" fill="#292524" />
                        <circle cx="117" cy="78" r="2" fill="#ffffff" />
                        
                        {/* Smile */}
                        <path d="M 82 90 Q 90 98 98 90" stroke="#292524" strokeWidth="3" strokeLinecap="round" fill="none" />
                        
                        {/* Blush */}
                        <ellipse cx="52" cy="88" rx="7" ry="4" fill="#fca5a5" opacity="0.9" />
                        <ellipse cx="128" cy="88" rx="7" ry="4" fill="#fca5a5" opacity="0.9" />

                        {/* Printer Status Lights */}
                        <circle cx="30" cy="120" r="3" fill="#22c55e" filter="drop-shadow(0 0 2px #4ade80)" />
                        <circle cx="30" cy="130" r="3" fill="#f59e0b" filter="drop-shadow(0 0 2px #fbbf24)" />

                        {/* Paper Output Slot */}
                        <rect x="40" y="125" width="100" height="8" rx="4" fill="#1c1917" />

                        {/* Animated Paper Feeding Out */}
                        <g className="printer-paper">
                            {/* Paper Shadow */}
                            <path d="M 48 130 L 132 130 L 145 178 L 35 178 Z" fill="#cbd5e1" />
                            {/* Paper Main */}
                            <path d="M 50 130 L 130 130 L 140 175 L 40 175 Z" fill="#ffffff" />
                            
                            {/* Paper text lines */}
                            <line x1="48" y1="145" x2="132" y2="145" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                            <line x1="46" y1="155" x2="134" y2="155" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                            <line x1="44" y1="165" x2="136" y2="165" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                        </g>
                    </svg>

                </div>
            </div>
        </div>
    );
};
