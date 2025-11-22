/**
 * Stop Button Component
 * Emergency stop control for autonomous execution
 */

import React, { useState } from "react"

interface StopButtonProps {
    onStop: () => void
    isExecuting: boolean
}

export function StopButton({ onStop, isExecuting }: StopButtonProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleClick = () => {
        if (!isConfirming) {
            setIsConfirming(true)
            // Reset confirmation after 3 seconds
            setTimeout(() => setIsConfirming(false), 3000)
        } else {
            onStop()
            setIsConfirming(false)
        }
    }

    return (
        <button
            className={`veritas-stop-button ${isExecuting ? "active" : ""} ${isConfirming ? "confirming" : ""}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={!isExecuting}
        >
            <span className="stop-icon">⏹</span>
            <span className="stop-text">
                {isConfirming ? "CONFIRM STOP?" : isHovered && isExecuting ? "ABORT EXECUTION" : "STOP"}
            </span>

            <style jsx>{`
                .veritas-stop-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    color: #ff4444;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 4px;
                    position: relative;
                    overflow: hidden;
                }

                .veritas-stop-button::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.2), transparent);
                    transition: left 0.5s;
                }

                .veritas-stop-button.active:hover::before {
                    left: 100%;
                }

                .veritas-stop-button.active:hover:not(:disabled) {
                    background: rgba(255, 0, 0, 0.2);
                    border-color: #ff4444;
                    box-shadow: 0 0 16px rgba(255, 0, 0, 0.4), inset 0 0 8px rgba(255, 0, 0, 0.1);
                    transform: translateY(-1px);
                }

                .veritas-stop-button.confirming {
                    background: rgba(255, 0, 0, 0.3);
                    border-color: #ff0000;
                    animation: confirmPulse 0.5s ease-in-out infinite;
                }

                .veritas-stop-button:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .veritas-stop-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .stop-icon {
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                }

                .stop-text {
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                @keyframes confirmPulse {
                    0%,
                    100% {
                        box-shadow: 0 0 16px rgba(255, 0, 0, 0.6);
                    }
                    50% {
                        box-shadow: 0 0 24px rgba(255, 0, 0, 0.8);
                    }
                }
            `}</style>
        </button>
    )
}
