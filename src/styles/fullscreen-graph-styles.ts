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
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
    },
    container: {
        position: 'relative' as const,
        width: '95vw',
        height: '95vh',
        border: `3px solid ${neonColors.cyan}`,
        boxShadow: `0 0 20px ${neonColors.cyan}, inset 0 0 20px rgba(0, 240, 255, 0.1)`,
        animation: 'neonBreath 3s ease-in-out infinite',
        background: neonColors.black,
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        overflow: 'hidden'
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
    button: {
        background: 'rgba(0, 240, 255, 0.1)',
        border: `1px solid ${neonColors.cyan}`,
        color: neonColors.cyan,
        padding: '8px 16px',
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: '2px',
        letterSpacing: '1px'
    },
    buttonHover: {
        background: 'rgba(0, 240, 255, 0.2)',
        boxShadow: `0 0 10px ${neonColors.cyan}`
    },
    closeButton: {
        background: 'transparent',
        border: `1px solid ${neonColors.red}`,
        color: neonColors.red,
        width: '36px',
        height: '36px',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        borderRadius: '2px'
    },
    controlPanel: {
        position: 'absolute' as const,
        top: '70px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        zIndex: 10
    },
    controlButton: {
        width: '40px',
        height: '40px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: `1px solid ${neonColors.cyan}`,
        color: neonColors.cyan,
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        borderRadius: '2px'
    },
    legend: {
        position: 'absolute' as const,
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        border: `1px solid ${neonColors.cyan}`,
        padding: '15px',
        borderRadius: '2px',
        zIndex: 10
    },
    legendTitle: {
        fontSize: '10px',
        color: neonColors.cyan,
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        marginBottom: '8px',
        fontWeight: 'bold'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
        fontSize: '11px'
    },
    legendDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    }
}



export const animationKeyframes = `
@keyframes neonBreath {
    0%, 100% {
        box-shadow: 0 0 20px #00F0FF, inset 0 0 20px rgba(0, 240, 255, 0.1);
        border-color: #00F0FF;
    }
    50% {
        box-shadow: 0 0 40px #00F0FF, 0 0 60px #FFD700, inset 0 0 40px rgba(0, 240, 255, 0.3);
        border-color: #FFD700;
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.9);
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
