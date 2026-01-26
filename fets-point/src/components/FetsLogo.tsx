import React from 'react';
import './FetsLogoAnimated.css';

export function FetsLogo() {
    return (
        <div className="fets-logo-container">
            {/* Ambient glow */}
            <div className="fets-logo-glow" />
            
            {/* Main spinning globe */}
            <div className="fets-logo-globe">
                <img 
                    src="/fets_globe_logo.png" 
                    alt="FETS.LIVE" 
                    className="fets-logo-img"
                    draggable="false"
                />
            </div>
        </div>
    );
}
