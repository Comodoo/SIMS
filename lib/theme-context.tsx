'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// Theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Color accent options
export type AccentColor = 'default' | 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'amber';

// Font size options
export type FontSize = 'small' | 'default' | 'large' | 'xlarge';

// Contrast options
export type ContrastLevel = 'default' | 'high';

// Reduce motion preference
export type MotionPreference = 'default' | 'reduced';

export interface ThemeSettings {
  mode: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  contrast: ContrastLevel;
  motion: MotionPreference;
  compactMode: boolean;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  accentColor: 'default',
  fontSize: 'default',
  contrast: 'default',
  motion: 'default',
  compactMode: false,
};

// Accent color CSS variable mappings
export const ACCENT_COLORS: Record<AccentColor, { name: string; hsl: string; preview: string }> = {
  default: { name: 'Default (Emerald)', hsl: '160 84% 39%', preview: '#10b981' },
  blue: { name: 'Blue', hsl: '217 91% 60%', preview: '#3b82f6' },
  green: { name: 'Forest Green', hsl: '142 76% 36%', preview: '#22c55e' },
  orange: { name: 'Orange', hsl: '25 95% 53%', preview: '#f97316' },
  purple: { name: 'Purple', hsl: '262 83% 58%', preview: '#8b5cf6' },
  red: { name: 'Red', hsl: '0 84% 60%', preview: '#ef4444' },
  teal: { name: 'Teal', hsl: '174 84% 32%', preview: '#14b8a6' },
  amber: { name: 'Amber', hsl: '38 92% 50%', preview: '#f59e0b' },
};

// Font size scale mappings
export const FONT_SIZES: Record<FontSize, { name: string; scale: number }> = {
  small: { name: 'Small', scale: 0.875 },
  default: { name: 'Default', scale: 1 },
  large: { name: 'Large', scale: 1.125 },
  xlarge: { name: 'Extra Large', scale: 1.25 },
};

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  settings: ThemeSettings;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  updateSettings: (updates: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Resolve the actual theme to apply
  const resolveTheme = (currentTheme: ThemeMode): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Apply all theme settings to document
  const applyThemeSettings = useCallback((currentSettings: ThemeSettings) => {
    const root = document.documentElement;
    const resolved = resolveTheme(currentSettings.mode);
    
    // Apply theme mode
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    setResolvedTheme(resolved);
    
    // Apply accent color
    if (currentSettings.accentColor !== 'default') {
      const accent = ACCENT_COLORS[currentSettings.accentColor];
      root.style.setProperty('--primary', accent.hsl);
    } else {
      root.style.removeProperty('--primary');
    }
    
    // Apply font size
    const fontScale = FONT_SIZES[currentSettings.fontSize].scale;
    root.style.setProperty('--font-scale', String(fontScale));
    root.style.fontSize = `${fontScale * 100}%`;
    
    // Apply contrast
    if (currentSettings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (currentSettings.motion === 'reduced') {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply compact mode
    if (currentSettings.compactMode) {
      root.classList.add('compact');
    } else {
      root.classList.remove('compact');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolved === 'dark' ? '#0a0a0a' : '#ffffff'
      );
    }
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem('themeSettings');
    let initialSettings = DEFAULT_THEME_SETTINGS;
    
    if (storedSettings) {
      try {
        initialSettings = { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(storedSettings) };
      } catch {
        // Use defaults if parse fails
      }
    }
    
    setSettings(initialSettings);
    applyThemeSettings(initialSettings);
    setMounted(true);
  }, [applyThemeSettings]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (settings.mode === 'system') {
        applyThemeSettings(settings);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings, applyThemeSettings]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    const newSettings = { ...settings, mode: newTheme };
    setSettings(newSettings);
    localStorage.setItem('themeSettings', JSON.stringify(newSettings));
    applyThemeSettings(newSettings);
  }, [settings, applyThemeSettings]);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  const updateSettings = useCallback((updates: Partial<ThemeSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('themeSettings', JSON.stringify(newSettings));
    applyThemeSettings(newSettings);
  }, [settings, applyThemeSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_THEME_SETTINGS);
    localStorage.removeItem('themeSettings');
    applyThemeSettings(DEFAULT_THEME_SETTINGS);
  }, [applyThemeSettings]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ 
        theme: 'system', 
        resolvedTheme: 'light', 
        settings: DEFAULT_THEME_SETTINGS,
        setTheme: () => {}, 
        toggleTheme: () => {},
        updateSettings: () => {},
        resetSettings: () => {},
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ 
      theme: settings.mode, 
      resolvedTheme, 
      settings,
      setTheme, 
      toggleTheme,
      updateSettings,
      resetSettings,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
