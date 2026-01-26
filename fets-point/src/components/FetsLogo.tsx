import React from 'react';
import './FetsLogoAnimated.css';

export function FetsLogo() {
    return (
        <div className="fets-logo-container">
            {/* Crystalline Glow */}
            <div className="fets-logo-glow" />
            
            {/* Spinning/Breathing Core */}
            <div className="fets-logo-globe">
                <img 
                    src="/fets_ultimate_logo.png" 
                    alt="FETS.LIVE" 
                    className="fets-logo-img"
                    draggable="false"
                />
                
                {/* Surface Shine/Refraction Effect */}
                <div className="fets-logo-shine" />
            </div>
            
            {/* Orbital Ring (Subtle) */}
            <div className="fets-logo-orbit" />
        </div>
    );
}
