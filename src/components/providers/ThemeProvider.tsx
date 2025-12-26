'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeName } from '@/lib/design-tokens';
import { createClient } from '@/lib/supabase/client';

interface ThemeColors {
  violet: string;
  blue: string;
  green: string;
  orange: string;
  yellow: string;
}

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'tejas-portfolio-theme';
const VALID_THEMES: ThemeName[] = ['dark', 'cyber', 'dracula', 'solarized'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);

  // Apply custom theme colors from database
  useEffect(() => {
    const applyCustomColors = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_settings')
          .select('theme_config')
          .single();
        
        if (data?.theme_config) {
          const config = data.theme_config as { colors?: ThemeColors };
          if (config.colors) {
            const root = document.documentElement;
            Object.entries(config.colors).forEach(([key, value]) => {
              if (value) {
                root.style.setProperty(`--${key}`, value);
              }
            });
            // Also set --accent to blue for consistent accent color
            if (config.colors.blue) {
              root.style.setProperty('--accent', config.colors.blue);
            }
          }
        }
      } catch {
        // Silently fail - use default colors
      }
    };
    
    applyCustomColors();
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored as ThemeName)) {
        setThemeState(stored as ThemeName);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
