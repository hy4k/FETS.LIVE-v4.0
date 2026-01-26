import React from 'react';
import './FetsLogoAnimated.css';

export function FetsLogo() {
    return (
        <div className="fets-logo-container">
            {/* Outer glow ring */}
            <div className="fets-logo-glow-ring" />
            
            {/* Main spinning logo */}
            <div className="fets-logo-sphere">
                <img 
                    src="/fets_sphere_logo.png" 
                    alt="FETS.LIVE" 
                    className="fets-logo-image"
                />
            </div>
            
            {/* Ambient particles */}
            <div className="fets-logo-particles">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className="fets-particle"
                        style={{
                            '--delay': `${i * 0.5}s`,
                            '--angle': `${i * 60}deg`,
                        } as React.CSSProperties}
                    />
                ))}
            </div>
        </div>
    );
}
