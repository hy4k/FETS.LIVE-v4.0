import React from 'react';

export function FetsLogo() {
    return (
        <div className="flex items-center">
            <img 
                src="/fets_live_logo.png" 
                alt="FETS.LIVE" 
                className="h-20 md:h-24 w-auto object-contain"
                style={{ 
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                    minHeight: '60px'
                }}
            />
        </div>
    );
}
