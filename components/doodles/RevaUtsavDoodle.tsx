import React from 'react';

export const RevaUtsavDoodle: React.FC = () => {
    return (
        <svg
            width="720" height="240" viewBox="0 0 720 240"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <style>{`
                    .spin-disco {
                        animation: spin 30s linear infinite;
                        transform-origin: 600px 115px;
                    }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
                {/* Mic gradient */}
                <linearGradient id="vintageMic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3D00" />
                    <stop offset="40%" stopColor="#FFC107" />
                    <stop offset="100%" stopColor="#9C27B0" />
                </linearGradient>

                {/* Disco ball gradient */}
                <radialGradient id="discoVibrant" cx="30%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="25%" stopColor="#00F2FE" />
                    <stop offset="65%" stopColor="#FF007F" />
                    <stop offset="100%" stopColor="#9C27B0" />
                </radialGradient>
            </defs>

            {/* ══════════════════════════════════════════════════════════
                M1 — BHARATANATYAM DANCERS  (Indian Classical Dance)
                Contrasts M2 (modern dance) with traditional Reva Utsav theme:
                  Kireeta headdress  · Angular mudra arms  · Aramandi leg stance
                  Nupura anklet dots · Anjali mudra at V-center (hands in prayer)
                ══════════════════════════════════════════════════════════ */}
            <g>
                {/* ████ WHITE OUTLINES — traced before color, every limb covered ████ */}

                {/* Head halos */}
                <circle cx="80"  cy="53" r="13" fill="#F5F5F5" />
                <circle cx="180" cy="53" r="13" fill="#F5F5F5" />

                {/* Headdress crown halos (kireeta) */}
                <path d="M 71 46 Q 80 34 89 46" fill="none" stroke="#F5F5F5" strokeWidth="5" strokeLinecap="round" />
                <path d="M 171 46 Q 180 34 189 46" fill="none" stroke="#F5F5F5" strokeWidth="5" strokeLinecap="round" />

                {/* Hip joint halos */}
                <circle cx="80"  cy="150" r="9" fill="#F5F5F5" />
                <circle cx="180" cy="150" r="9" fill="#F5F5F5" />

                {/* LEFT dancer white outlines */}
                <line x1="80" y1="62"  x2="80" y2="150"   stroke="#F5F5F5" strokeWidth="19" strokeLinecap="round" />
                <path d="M 80 78 L 100 95 L 130 118"       fill="none" stroke="#F5F5F5" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 80 78 L 64 62 L 69 47"          fill="none" stroke="#F5F5F5" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="80" y1="150" x2="57" y2="176"   stroke="#F5F5F5" strokeWidth="16" strokeLinecap="round" />
                <line x1="80" y1="150" x2="97" y2="173"   stroke="#F5F5F5" strokeWidth="15" strokeLinecap="round" />

                {/* RIGHT dancer white outlines */}
                <line x1="180" y1="62"  x2="180" y2="150"  stroke="#F5F5F5" strokeWidth="19" strokeLinecap="round" />
                <path d="M 180 78 L 160 95 L 130 118"       fill="none" stroke="#F5F5F5" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 180 78 L 196 62 L 191 47"        fill="none" stroke="#F5F5F5" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="180" y1="150" x2="203" y2="176"  stroke="#F5F5F5" strokeWidth="16" strokeLinecap="round" />
                <line x1="180" y1="150" x2="163" y2="173"  stroke="#F5F5F5" strokeWidth="15" strokeLinecap="round" />

                {/* ── LEFT BHARATANATYAM DANCER — cyan ── */}
                <g stroke="#00D4F0" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {/* Kireeta (headdress crown arc) */}
                    <path d="M 71 46 Q 80 34 89 46" strokeWidth="2" />
                    {/* Head */}
                    <circle cx="80" cy="53" r="9" fill="#00D4F0" stroke="none" />
                    {/* Eyes */}
                    <circle cx="77" cy="51" r="1.5" fill="#0D1B2A" />
                    <circle cx="83" cy="51" r="1.5" fill="#0D1B2A" />
                    {/* Smile */}
                    <path d="M 77 55 Q 80 58 83 55" fill="none" stroke="#0D1B2A" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Torso */}
                    <line x1="80" y1="62" x2="80" y2="150" strokeWidth="11" />
                    {/* Mudra inner arm — ANGULAR bent-elbow path to V (not smooth like M2) */}
                    <path d="M 80 78 L 100 95 L 130 118" strokeWidth="8" />
                    {/* Free arm — bent-elbow mudra raising UP-LEFT */}
                    <path d="M 80 78 L 64 62 L 69 47" strokeWidth="6" />
                    {/* Gold nails/mudra fingertip */}
                    <circle cx="69" cy="46" r="3.5" fill="#FFE000" stroke="none" />
                    {/* Hip joint */}
                    <circle cx="80" cy="150" r="5" fill="#00D4F0" stroke="none" />
                    {/* Aramandi left leg — turned OUT wide (classical stance) */}
                    <line x1="80" y1="150" x2="57" y2="176" strokeWidth="9" />
                    {/* Aramandi right leg — turned OUT right (symmetric classical squat) */}
                    <line x1="80" y1="150" x2="97" y2="173" strokeWidth="8" />
                    {/* Nupura (anklet) gold dots at feet */}
                    <circle cx="57"  cy="176" r="2.5" fill="#FFE000" stroke="none" />
                    <circle cx="97"  cy="173" r="2.5" fill="#FFE000" stroke="none" />
                </g>

                {/* ── RIGHT BHARATANATYAM DANCER — hot pink — mirror pose ── */}
                <g stroke="#FF2D78" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {/* Kireeta */}
                    <path d="M 171 46 Q 180 34 189 46" strokeWidth="2" />
                    {/* Head */}
                    <circle cx="180" cy="53" r="9" fill="#FF2D78" stroke="none" />
                    {/* Eyes */}
                    <circle cx="177" cy="51" r="1.5" fill="#0D1B2A" />
                    <circle cx="183" cy="51" r="1.5" fill="#0D1B2A" />
                    {/* Smile */}
                    <path d="M 177 55 Q 180 58 183 55" fill="none" stroke="#0D1B2A" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Torso */}
                    <line x1="180" y1="62" x2="180" y2="150" strokeWidth="11" />
                    {/* Mudra inner arm — angular bent-elbow to V */}
                    <path d="M 180 78 L 160 95 L 130 118" strokeWidth="8" />
                    {/* Free arm — bent-elbow mudra UP-RIGHT */}
                    <path d="M 180 78 L 196 62 L 191 47" strokeWidth="6" />
                    {/* Gold fingertip */}
                    <circle cx="191" cy="46" r="3.5" fill="#FFE000" stroke="none" />
                    {/* Hip joint */}
                    <circle cx="180" cy="150" r="5" fill="#FF2D78" stroke="none" />
                    {/* Aramandi right leg */}
                    <line x1="180" y1="150" x2="203" y2="176" strokeWidth="9" />
                    {/* Aramandi left leg */}
                    <line x1="180" y1="150" x2="163" y2="173" strokeWidth="8" />
                    {/* Nupura anklet dots */}
                    <circle cx="203" cy="176" r="2.5" fill="#FFE000" stroke="none" />
                    <circle cx="163" cy="173" r="2.5" fill="#FFE000" stroke="none" />
                </g>

                {/* Anjali mudra at V-center — both dancers' hands meet in prayer/namaste */}
                <circle cx="130" cy="118" r="6" fill="#FFE000" opacity="0.95" />
                {/* Subtle kolam dots radiating from the anjali point */}
                <circle cx="122" cy="112" r="1.5" fill="#FFE000" opacity="0.5" />
                <circle cx="138" cy="112" r="1.5" fill="#FFE000" opacity="0.5" />
            </g>






            {/* ══════════════════════════════════════════════
                I — VINTAGE PILL MICROPHONE (shifted down to align baselines)
                ══════════════════════════════════════════════ */}
            <g transform="translate(0, 10)">
                {/* Base */}
                <rect x="235" y="160" width="70" height="8" rx="4" fill="#F5F5F5" opacity="0.95" />
                {/* Stand pole */}
                <line x1="270" y1="110" x2="270" y2="160" stroke="#F5F5F5" strokeWidth="8" strokeLinecap="round" />
                {/* U-bracket */}
                <path d="M 242 85 Q 242 110 270 110 Q 298 110 298 85"
                      fill="none" stroke="#F5F5F5" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
                {/* Capsule */}
                <rect x="246" y="36" width="48" height="74" rx="24" fill="url(#vintageMic)" stroke="#FFF" strokeWidth="4" />
                {/* Grill lines */}
                <line x1="246" y1="54" x2="294" y2="54" stroke="#FFF" strokeWidth="3" />
                <line x1="246" y1="73" x2="294" y2="73" stroke="#FFF" strokeWidth="3" />
                <line x1="246" y1="92" x2="294" y2="92" stroke="#FFF" strokeWidth="3" />

                {/* Static music notes around the mic */}
                <text x="242" y="30" fontSize="18" fill="#00F2FE" fontFamily="Arial, sans-serif"
                      transform="rotate(-20, 242, 30)" opacity="0.9">&#9835;</text>
                <text x="300" y="26" fontSize="20" fill="#FFE000" fontFamily="Arial, sans-serif"
                      transform="rotate(15, 300, 26)" opacity="0.9">&#9834;</text>
                <text x="228" y="52" fontSize="14" fill="#FF2D78" fontFamily="Arial, sans-serif"
                      transform="rotate(-10, 228, 52)" opacity="0.75">&#9836;</text>
            </g>

            {/* ══════════════════════════════════════════════════════════
                M2 — DJ SPEAKER TOWER CABINETS
                Two real speaker boxes — NOT stick figures.
                Cabinet = M outer verticals  ·  Sound beams = M V-diagonals
                Tweeter dome ·  4-ring Woofer  ·  Bass port
                Inward beams converge at gold crossover ·  Outward 4-layer waves
                ══════════════════════════════════════════════════════════ */}
            <g transform="translate(0, -15)">
                {/* ████ WHITE BACKGROUNDS — cabinet halos + V-beam halos ████ */}
                <rect x="353" y="41" width="52" height="152" rx="12" fill="#F5F5F5" />
                <rect x="445" y="41" width="52" height="152" rx="12" fill="#F5F5F5" />
                {/* V-beam halos — bold solid connection */}
                <path d="M 401 50 L 425 135 L 449 50" fill="none" stroke="#F5F5F5" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />

                {/* ── LEFT SPEAKER CABINET — cyan ── */}
                <rect x="357" y="45" width="44" height="144" rx="8" fill="#091A2E" stroke="#00D4F0" strokeWidth="3" />
                <circle cx="379" cy="64" r="8"    fill="#00D4F0" stroke="none" />
                <circle cx="379" cy="64" r="4.5"  fill="#0D1B2A" stroke="none" />
                <circle cx="379" cy="64" r="1.8"  fill="#00D4F0" stroke="none" />
                <circle cx="379" cy="64" r="10.5" fill="none" stroke="#FFE000" strokeWidth="1.5" opacity="0.65" />
                <circle cx="379" cy="118" r="20" fill="none" stroke="#00D4F0" strokeWidth="2.5" />
                <circle cx="379" cy="118" r="14" fill="none" stroke="#00D4F0" strokeWidth="1.8" opacity="0.7" />
                <circle cx="379" cy="118" r="9"  fill="#00D4F0" opacity="0.25" stroke="none" />
                <circle cx="379" cy="118" r="5"  fill="#00D4F0" stroke="none" />
                <circle cx="379" cy="118" r="2"  fill="#0D1B2A" stroke="none" />
                <rect x="366" y="172" width="26" height="8" rx="4" fill="none" stroke="#00D4F0" strokeWidth="1.5" opacity="0.7" />
                {/* Neon Tube V (Left Side) */}
                <line x1="401" y1="50" x2="425" y2="135" stroke="#00D4F0" strokeWidth="10" strokeLinecap="round" />
                <line x1="401" y1="50" x2="425" y2="135" stroke="#00D4F0" strokeWidth="16" strokeLinecap="round" opacity="0.4" />

                {/* ── RIGHT SPEAKER CABINET — hot pink ── */}
                <rect x="449" y="45" width="44" height="144" rx="8" fill="#091A2E" stroke="#FF2D78" strokeWidth="3" />
                <circle cx="471" cy="64" r="8"    fill="#FF2D78" stroke="none" />
                <circle cx="471" cy="64" r="4.5"  fill="#0D1B2A" stroke="none" />
                <circle cx="471" cy="64" r="1.8"  fill="#FF2D78" stroke="none" />
                <circle cx="471" cy="64" r="10.5" fill="none" stroke="#FFE000" strokeWidth="1.5" opacity="0.65" />
                <circle cx="471" cy="118" r="20" fill="none" stroke="#FF2D78" strokeWidth="2.5" />
                <circle cx="471" cy="118" r="14" fill="none" stroke="#FF2D78" strokeWidth="1.8" opacity="0.7" />
                <circle cx="471" cy="118" r="9"  fill="#FF2D78" opacity="0.25" stroke="none" />
                <circle cx="471" cy="118" r="5"  fill="#FF2D78" stroke="none" />
                <circle cx="471" cy="118" r="2"  fill="#0D1B2A" stroke="none" />
                <rect x="458" y="172" width="26" height="8" rx="4" fill="none" stroke="#FF2D78" strokeWidth="1.5" opacity="0.7" />
                {/* Neon Tube V (Right Side) */}
                <line x1="449" y1="50" x2="425" y2="135" stroke="#FF2D78" strokeWidth="10" strokeLinecap="round" />
                <line x1="449" y1="50" x2="425" y2="135" stroke="#FF2D78" strokeWidth="16" strokeLinecap="round" opacity="0.4" />

                {/* ════ OUTWARD SOUND WAVES — 4-layer fade ════ */}
                {/* Left speaker → LEFT waves */}
                <path d="M 355 111 Q 340 118 355 125"  fill="none" stroke="#00D4F0" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
                <path d="M 340 101 Q 320 118 340 135"  fill="none" stroke="#00D4F0" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
                <path d="M 324 90  Q 298 118 324 146"  fill="none" stroke="#00D4F0" strokeWidth="2.1" strokeLinecap="round" opacity="0.38" />
                <path d="M 308 78  Q 276 118 308 158"  fill="none" stroke="#00D4F0" strokeWidth="1.4" strokeLinecap="round" opacity="0.15" />
                {/* Right speaker → RIGHT waves */}
                <path d="M 495 111 Q 510 118 495 125"  fill="none" stroke="#FF2D78" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
                <path d="M 510 101 Q 530 118 510 135"  fill="none" stroke="#FF2D78" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
                <path d="M 526 90  Q 552 118 526 146"  fill="none" stroke="#FF2D78" strokeWidth="2.1" strokeLinecap="round" opacity="0.38" />
                <path d="M 542 78  Q 574 118 542 158"  fill="none" stroke="#FF2D78" strokeWidth="1.4" strokeLinecap="round" opacity="0.15" />

                {/* Glowing Core at V base */}
                <circle cx="425" cy="135" r="9"  fill="#FFE000" />
                <circle cx="425" cy="135" r="15" fill="none" stroke="#FFE000" strokeWidth="3" opacity="0.6" />
                <circle cx="425" cy="135" r="23" fill="none" stroke="#FFE000" strokeWidth="1.5" opacity="0.3" />
            </g>














            {/* ══════════════════════════════════════════════
                O — POP-ART DISCO BALL  (static)
                ══════════════════════════════════════════════ */}
            <g>
                {/* Hanger */}
                <line x1="600" y1="20" x2="600" y2="55" stroke="#FFF" strokeWidth="3" opacity="0.8" />
                <path d="M 590 55 L 610 55 L 605 60 L 595 60 Z" fill="#FFF" opacity="0.9" />

                <g className="spin-disco">
                <clipPath id="discoClip">
                    <circle cx="600" cy="115" r="55" />
                </clipPath>
                <g clipPath="url(#discoClip)">
                    <circle cx="600" cy="115" r="55" fill="url(#discoVibrant)" />
                    {/* Latitude lines */}
                    <path d="M 545 75 Q 600 90 655 75"    fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 545 95 Q 600 115 655 95"   fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 545 115 Q 600 140 655 115" fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 545 135 Q 600 165 655 135" fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    {/* Longitude lines */}
                    <path d="M 560 60 Q 575 115 560 170"  fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 580 60 Q 600 115 580 170"  fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 600 60 L 600 170"          fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 620 60 Q 600 115 620 170"  fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    <path d="M 640 60 Q 625 115 640 170"  fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.5" />
                    {/* Glint tiles */}
                    <path d="M 580 95 L 600 95 L 600 115 L 580 115 Z"   fill="#FFF"    opacity="0.9" />
                    <path d="M 600 115 L 620 115 L 620 135 L 600 135 Z" fill="#FFE000" opacity="0.9" />
                    <path d="M 570 120 L 585 120 L 585 140 L 570 140 Z" fill="#00F2FE" opacity="0.9" />
                    <path d="M 610 85 L 625 85 L 625 105 L 610 105 Z"   fill="#FFF"    opacity="0.7" />
                </g>
                {/* Outline */}
                <circle cx="600" cy="115" r="55" fill="none" stroke="#FFF" strokeWidth="5" />
                </g>

                {/* 4-point stars */}
                <path d="M 535 55 Q 535 70 550 70 Q 535 70 535 85 Q 535 70 520 70 Q 535 70 535 55" fill="#FFE000" />
                <path d="M 660 145 Q 660 155 670 155 Q 660 155 660 165 Q 660 155 650 155 Q 660 155 660 145" fill="#00F2FE" />
                <path d="M 665 65 Q 665 72 672 72 Q 665 72 665 79 Q 665 72 658 72 Q 665 72 665 65" fill="#FF007F" />
            </g>
        </svg>
    );
};
