/**
 * Janus Theme System
 * Supports dark/light mode with smooth transitions
 */

export const themes = {
  dark: {
    name: 'dark',
    colors: {
      // Backgrounds
      background: '#0f172a',
      backgroundSecondary: '#1e293b',
      backgroundTertiary: '#334155',
      surface: '#1e293b',
      surfaceHover: '#334155',

      // Text
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',

      // Borders
      border: '#334155',
      borderLight: '#475569',

      // Accents
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#22d3ee',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',

      // Charts
      chart1: '#3b82f6',
      chart2: '#22c55e',
      chart3: '#f59e0b',
      chart4: '#ef4444',
      chart5: '#8b5cf6',
      chart6: '#06b6d4',

      // Gradients
      gradientStart: '#3b82f6',
      gradientEnd: '#8b5cf6',

      // Shadows
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowLight: 'rgba(0, 0, 0, 0.1)',

      // Status
      online: '#22c55e',
      offline: '#ef4444',
      pending: '#f59e0b'
    },
    effects: {
      glowPrimary: '0 0 20px rgba(59, 130, 246, 0.3)',
      glowSecondary: '0 0 20px rgba(34, 211, 238, 0.3)',
      glowSuccess: '0 0 20px rgba(34, 197, 94, 0.3)',
      cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)'
    }
  },
  light: {
    name: 'light',
    colors: {
      // Backgrounds
      background: '#f8fafc',
      backgroundSecondary: '#ffffff',
      backgroundTertiary: '#f1f5f9',
      surface: '#ffffff',
      surfaceHover: '#f1f5f9',

      // Text
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',

      // Borders
      border: '#e2e8f0',
      borderLight: '#f1f5f9',

      // Accents
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#0891b2',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0891b2',

      // Charts
      chart1: '#3b82f6',
      chart2: '#16a34a',
      chart3: '#d97706',
      chart4: '#dc2626',
      chart5: '#7c3aed',
      chart6: '#0891b2',

      // Gradients
      gradientStart: '#3b82f6',
      gradientEnd: '#7c3aed',

      // Shadows
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',

      // Status
      online: '#16a34a',
      offline: '#dc2626',
      pending: '#d97706'
    },
    effects: {
      glowPrimary: '0 0 20px rgba(59, 130, 246, 0.15)',
      glowSecondary: '0 0 20px rgba(8, 145, 178, 0.15)',
      glowSuccess: '0 0 20px rgba(22, 163, 74, 0.15)',
      cardShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
    }
  }
};

// CSS variables generator
export function generateCSSVariables(theme) {
  const t = themes[theme];
  return `
    :root {
      --bg-primary: ${t.colors.background};
      --bg-secondary: ${t.colors.backgroundSecondary};
      --bg-tertiary: ${t.colors.backgroundTertiary};
      --surface: ${t.colors.surface};
      --surface-hover: ${t.colors.surfaceHover};

      --text-primary: ${t.colors.text};
      --text-secondary: ${t.colors.textSecondary};
      --text-muted: ${t.colors.textMuted};

      --border: ${t.colors.border};
      --border-light: ${t.colors.borderLight};

      --primary: ${t.colors.primary};
      --primary-hover: ${t.colors.primaryHover};
      --secondary: ${t.colors.secondary};
      --success: ${t.colors.success};
      --warning: ${t.colors.warning};
      --error: ${t.colors.error};
      --info: ${t.colors.info};

      --chart-1: ${t.colors.chart1};
      --chart-2: ${t.colors.chart2};
      --chart-3: ${t.colors.chart3};
      --chart-4: ${t.colors.chart4};
      --chart-5: ${t.colors.chart5};
      --chart-6: ${t.colors.chart6};

      --gradient-start: ${t.colors.gradientStart};
      --gradient-end: ${t.colors.gradientEnd};

      --shadow: ${t.colors.shadow};
      --shadow-light: ${t.colors.shadowLight};

      --glow-primary: ${t.effects.glowPrimary};
      --glow-secondary: ${t.effects.glowSecondary};
      --card-shadow: ${t.effects.cardShadow};

      --status-online: ${t.colors.online};
      --status-offline: ${t.colors.offline};
      --status-pending: ${t.colors.pending};
    }
  `;
}

// Theme context hook
import { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {}
});

export function ThemeProvider({ children, defaultTheme = 'dark' }) {
  const [theme, setThemeState] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('janus-theme');
      if (saved) return saved;

      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return defaultTheme;
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('janus-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Apply CSS variables when theme changes
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'janus-theme-vars';
    style.textContent = generateCSSVariables(theme);

    // Remove old style if exists
    const existing = document.getElementById('janus-theme-vars');
    if (existing) existing.remove();

    document.head.appendChild(style);

    // Update body class
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);

    return () => {
      const el = document.getElementById('janus-theme-vars');
      if (el) el.remove();
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors: themes[theme].colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default themes;
