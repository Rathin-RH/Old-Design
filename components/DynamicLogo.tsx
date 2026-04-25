import React from 'react';
import { RevaUtsavDoodle } from './doodles/RevaUtsavDoodle';

type DoodleTheme = 'default' | 'reva-utsav';

interface DynamicLogoProps {
    forceTheme?: DoodleTheme; 
}

export const DynamicLogo: React.FC<DynamicLogoProps> = ({ forceTheme }) => {
    const activeTheme: DoodleTheme = forceTheme || 'reva-utsav';

    if (activeTheme === 'reva-utsav') {
        return <RevaUtsavDoodle />;
    }

    return (
        <svg width="680" height="175" viewBox="0 0 680 175" style={{ overflow: 'visible', filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.45))' }}>
            <defs>
                <style>{`@import url('https://fonts.cdnfonts.com/css/lovelo');`}</style>
                <linearGradient id="mimoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                </linearGradient>
            </defs>
            <text 
                x="50%" y="52%" 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fill="url(#mimoGrad)" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="1.5"
                strokeLinejoin="bevel"
                strokeLinecap="butt"
                style={{ 
                    fontFamily: "'Lovelo', sans-serif", 
                    fontSize: '158px', 
                    fontWeight: 900,
                    letterSpacing: '12px',
                    paintOrder: 'stroke fill'
                }}
            >
                MIMO
            </text>
        </svg>
    );
};
