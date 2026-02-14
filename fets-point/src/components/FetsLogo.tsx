import React from 'react';
import './FetsLogoAnimated.css';
import { Zap } from 'lucide-react';

export function FetsLogo() {
    return (
        <div className="fets-text-logo-container">
            <div className="fets-logo-icon-wrapper">
                <div className="fets-logo-icon">
                    <Zap className="fets-icon-zap" />
                </div>
            </div>
            <div className="fets-logo-text-wrapper">
                <div className="fets-main-text">
                    FETS
                    <span className="fets-dot">.</span>
                </div>
                <div className="fets-sub-text">
                    LIVE
                </div>
            </div>
        </div>
    );
}
