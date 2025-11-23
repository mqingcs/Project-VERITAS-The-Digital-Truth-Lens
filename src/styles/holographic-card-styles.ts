export const enhancedCardStyles = {
  // Base card
  card: {
    background: 'rgba(10, 10, 15, 0.97)',
    backdropFilter: 'blur(20px)',
    border: '2px solid #00F0FF',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    color: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    zIndex: 2147483647, // Max z-index
    pointerEvents: 'auto' as const,
    position: 'absolute' as const,
  },

  // Neon breathing animation class name (to be used with keyframes)
  neonBreath: 'veritas-neon-breath',

  // Glitch effect class name
  glitch: 'veritas-glitch',

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
    background: 'rgba(0, 240, 255, 0.05)',
    cursor: 'grab',
    userSelect: 'none' as const,
  },

  headerTitle: {
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    color: '#00F0FF',
    fontWeight: 'bold' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  headerControls: {
    display: 'flex',
    gap: '8px',
  },

  controlBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 4px',
    transition: 'color 0.2s',
  },

  // Tab system
  tabs: {
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
      background: 'rgba(0, 0, 0, 0.2)',
      position: 'relative' as const,
    },
    container: {
      display: 'flex',
      gap: '2px',
      padding: '0 4px',
      overflowX: 'auto' as const,
      scrollbarWidth: 'none' as const, // Firefox
      msOverflowStyle: 'none' as const,  // IE 10+
      whiteSpace: 'nowrap' as const,
      flex: 1,
      scrollBehavior: 'smooth' as const,
      // Hide scrollbar for WebKit
      '::-webkit-scrollbar': {
        display: 'none'
      }
    },
    tab: {
      padding: '10px 12px',
      fontSize: '10px',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.5)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
      flexShrink: 0, // Prevent shrinking
    },
    tabActive: {
      color: '#FFD700',
      borderBottom: '2px solid #FFD700',
      background: 'rgba(255, 215, 0, 0.05)',
    },
    scrollBtn: {
      background: 'rgba(0, 0, 0, 0.4)',
      border: 'none',
      color: '#00F0FF',
      cursor: 'pointer',
      padding: '0 8px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      transition: 'background 0.2s',
      fontSize: '12px',
    }
  },

  // Content Area
  content: {
    padding: '16px',
    overflowY: 'auto' as const,
    flex: 1,
    minHeight: '200px',
  },

  // Risk gauge colors
  riskColors: {
    low: '#10b981',    // Green
    medium: '#f59e0b', // Orange
    high: '#ef4444',   // Red
  },

  // Typography
  label: {
    fontSize: '9px',
    color: '#FFD700',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    opacity: 0.8,
  },

  text: {
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#E0E0E0',
  },

  // Badges
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    marginRight: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  // Action Buttons
  actionBtn: {
    background: 'rgba(0, 240, 255, 0.1)',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    color: '#00F0FF',
    padding: '6px 12px',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
  },

  gaugeContainer: {
    position: 'relative' as const,
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

// Animation keyframes (inject into shadow DOM)
export const animationKeyframes = `
  @keyframes veritas-neon-breath {
    0%, 100% { 
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 5px rgba(0, 240, 255, 0.1);
      border-color: #00F0FF;
    }
    50% { 
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.1);
      border-color: #FFD700;
    }
  }

  @keyframes veritas-glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); text-shadow: 2px 2px #ff00de; }
    40% { transform: translate(2px, -2px); text-shadow: -2px -2px #00ffff; }
    60% { transform: translate(-2px, -2px); }
    80% { transform: translate(2px, 2px); }
    100% { transform: translate(0); text-shadow: none; }
  }

  @keyframes veritas-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 240, 255, 0.3);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 240, 255, 0.5);
  }
`
