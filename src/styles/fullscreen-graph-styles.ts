/**
 * Fullscreen Graph Modal Styles
 * Digital Brutalism aesthetic for Project VERITAS
 */

export const neonColors = {
    cyan: '#00F0FF',
    gold: '#FFD700',
    green: '#10b981',
    red: '#ef4444',
    gray: '#9ca3af',
    black: '#000000',
    white: '#ffffff'
}

export const modalStyles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.98)',
        zIndex: 2147483647, // Max z-index to match card
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto' as const // Enable interaction
    },
    container: {
        position: 'absolute' as const, // Changed from relative to absolute for dragging
        width: '90vw', // Slightly smaller
        height: '90vh',
        border: `3px solid ${neonColors.cyan}`,
        boxShadow: `0 0 30px ${neonColors.cyan}, inset 0 0 20px rgba(0, 240, 255, 0.1)`,
        animation: 'neonBreath 4s ease-in-out infinite', // Slower, smoother animation
        background: neonColors.black,
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        overflow: 'hidden',
        transition: 'box-shadow 0.5s ease, border-color 0.5s ease' // Smooth transitions
    },
    header: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderBottom: `1px solid ${neonColors.cyan}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10
    },
    title: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: neonColors.cyan,
        textTransform: 'uppercase' as const,
        letterSpacing: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    glowDot: {
        width: '10px',
        height: '10px',
        background: neonColors.gold,
        borderRadius: '50%',
        boxShadow: `0 0 10px ${neonColors.gold}`,
        animation: 'pulse 2s ease-in-out infinite'
    },
    emptyState: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: neonColors.cyan,
        fontSize: '16px',
        fontFamily: 'JetBrains Mono, monospace'
    }
}

export const controlStyles = {
    // Top Left: Filters
    filterContainer: {
        position: 'absolute' as const,
        top: '80px',
        left: '30px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '15px',
        zIndex: 20
    },
    filterButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${neonColors.cyan}`,
        padding: '8px 12px',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minWidth: '140px',
        boxShadow: `0 0 5px rgba(0, 240, 255, 0.1)`
    },
    filterButtonActive: {
        background: 'rgba(0, 240, 255, 0.15)',
        boxShadow: `0 0 15px ${neonColors.cyan}, inset 0 0 10px rgba(0, 240, 255, 0.1)`,
        borderColor: neonColors.cyan
    },
    filterDot: {
        width: '12px',
        height: '12px',
        borderRadius: '2px', // Square dots for brutalism
        boxShadow: '0 0 5px currentColor'
    },
    filterText: {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        color: neonColors.cyan
    },

    // Top Center: Search
    searchContainer: {
        position: 'absolute' as const,
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        border: `1px solid ${neonColors.cyan}`,
        borderRadius: '2px',
        padding: '5px',
        gap: '10px',
        zIndex: 20,
        boxShadow: `0 0 15px rgba(0, 240, 255, 0.15)`
    },
    searchBar: {
        background: 'transparent',
        border: 'none',
        color: neonColors.cyan,
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: '"JetBrains Mono", monospace',
        width: '250px',
        outline: 'none',
        letterSpacing: '1px'
    },
    searchNav: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        paddingRight: '5px',
        borderLeft: `1px solid rgba(0, 240, 255, 0.3)`,
        paddingLeft: '10px'
    },
    matchCount: {
        color: neonColors.gray,
        fontSize: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        marginRight: '10px',
        minWidth: '40px',
        textAlign: 'center' as const
    },
    navButton: {
        background: 'rgba(0, 240, 255, 0.1)',
        border: `1px solid ${neonColors.cyan}`,
        color: neonColors.cyan,
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        borderRadius: '2px',
        transition: 'all 0.2s'
    },

    // Bottom Left: Zoom Controls
    zoomContainer: {
        position: 'absolute' as const,
        bottom: '40px',
        left: '30px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        zIndex: 20
    },
    zoomButton: {
        width: '40px',
        height: '40px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: `1px solid ${neonColors.cyan}`,
        color: neonColors.cyan,
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        borderRadius: '2px',
        boxShadow: `0 0 10px rgba(0, 240, 255, 0.1)`
    },

    // Close Button (Top Right)
    closeButton: {
        background: 'transparent',
        border: `1px solid ${neonColors.red}`,
        color: neonColors.red,
        width: '36px',
        height: '36px',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        borderRadius: '2px',
        boxShadow: `0 0 5px rgba(239, 68, 68, 0.2)`
    }
}



export const animationKeyframes = `
@keyframes neonBreath {
    0% {
        box-shadow: 
            0 0 10px rgba(0, 240, 255, 0.5),
            0 0 20px rgba(0, 240, 255, 0.3),
            inset 0 0 15px rgba(0, 240, 255, 0.2);
        border-color: rgba(0, 240, 255, 0.8);
    }
    25% {
        box-shadow: 
            0 0 15px rgba(0, 240, 255, 0.6),
            0 0 30px rgba(0, 240, 255, 0.4),
            inset 0 0 20px rgba(0, 240, 255, 0.3);
        border-color: rgba(0, 240, 255, 1);
    }
    50% {
        box-shadow: 
            0 0 20px rgba(255, 215, 0, 0.5),
            0 0 40px rgba(255, 215, 0, 0.3),
            inset 0 0 25px rgba(255, 215, 0, 0.2);
        border-color: rgba(255, 215, 0, 0.8);
    }
    75% {
        box-shadow: 
            0 0 15px rgba(0, 240, 255, 0.6),
            0 0 30px rgba(0, 240, 255, 0.4),
            inset 0 0 20px rgba(0, 240, 255, 0.3);
        border-color: rgba(0, 240, 255, 1);
    }
    100% {
        box-shadow: 
            0 0 10px rgba(0, 240, 255, 0.5),
            0 0 20px rgba(0, 240, 255, 0.3),
            inset 0 0 15px rgba(0, 240, 255, 0.2);
        border-color: rgba(0, 240, 255, 0.8);
    }
}

@keyframes gradientBorder {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(0.95);
    }
}

@keyframes glitchIn {
    0% {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transform: translate(0, 0);
    }
    20% {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transform: translate(-5px, 0);
    }
    40% {
        clip-path: polygon(0 10%, 100% 0, 100% 90%, 0 100%);
        transform: translate(5px, 0);
    }
    60% {
        clip-path: polygon(0 0, 100% 5%, 100% 100%, 0 95%);
        transform: translate(-3px, 0);
    }
    80% {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transform: translate(2px, 0);
    }
    100% {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transform: translate(0, 0);
    }
}
`
