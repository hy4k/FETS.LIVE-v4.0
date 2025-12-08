import React from 'react';
import './FetsLogo.css';
import { Zap } from 'lucide-react';

export function FetsLogo() {
    const letters = "FETS.LIVE".split("");

    return (
        <div className="fets-logo-wrapper">
            <button className="fets-button">
                <div className="fets-outline" />
                <div className="fets-state">
                    <div className="icon">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <p>
                        {letters.map((char, index) => (
                            <span
                                key={index}
                                style={{ "--i": index } as React.CSSProperties}
                                className={char === '.' ? "mx-[2px]" : ""}
                            >
                                {char}
                            </span>
                        ))}
                    </p>
                </div>
            </button>
        </div>
    );
}
