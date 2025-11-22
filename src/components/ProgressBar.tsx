/**
 * Progress Bar Component
 * Shows current execution progress with cyberpunk aesthetic
 */

import React from "react"

interface ProgressBarProps {
    currentStep: number
    totalSteps: number
    status: string
}

export function ProgressBar({ currentStep, totalSteps, status }: ProgressBarProps) {
    const progress = Math.min((currentStep / totalSteps) * 100, 100)

    return (
        <div className="veritas-progress-container">
            <div className="progress-header">
                <span className="step-counter">
                    Step {currentStep}/{totalSteps}
                </span>
                <span className="step-status">{status}</span>
            </div>

            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}>
                    <div className="progress-glow" />
                </div>
            </div>

            <style jsx>{`
                .veritas-progress-container {
                    margin: 12px 0;
                    font-family: "JetBrains Mono", monospace;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .step-counter {
                    color: #00f0ff;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                .step-status {
                    color: #ffd700;
                    opacity: 0.9;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .progress-track {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #00f0ff, #ffd700);
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
                }

                .progress-glow {
                    position: absolute;
                    top: -2px;
                    right: 0;
                    width: 8px;
                    height: 8px;
                    background: #ffd700;
                    border-radius: 50%;
                    box-shadow: 0 0 12px #ffd700, 0 0 24px rgba(255, 215, 0, 0.5);
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.3);
                    }
                }
            `}</style>
        </div>
    )
}
