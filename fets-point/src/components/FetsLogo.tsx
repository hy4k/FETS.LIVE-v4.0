import React from 'react';

export function FetsLogo() {
    return (
        <div className="flex items-center">
            <img 
                src="/fets_live_logo.png" 
                alt="FETS.LIVE" 
                className="h-14 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
        </div>
    );
}
