import React from 'react';
import './FetsLogo.css';

export function FetsLogo() {
    return (
        <div className="fets-logo-3d-container">
            <div className="fets-logo-3d-wrapper">
                <div className="logo-accent-line top"></div>
                <div className="logo-main-text">
                    <span className="text-fets">FETS</span>
                    <span className="text-dot main-dot">.</span>
                    <span className="text-live">LIVE</span>
                    <span className="text-dot end-dot">.</span>
                </div>
                <div className="logo-accent-line bottom"></div>

                {/* Decorative Dots from the image */}
                <div className="logo-deco-dot dot-1"></div>
                <div className="logo-deco-dot dot-2"></div>
            </div>
        </div>
    );
}
