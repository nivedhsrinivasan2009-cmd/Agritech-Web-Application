// Dark Mode Support for Gracia Visitor App
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gracia_theme';

// Theme options
export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Get stored theme preference
export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || Theme.SYSTEM;
  } catch (e) {
    return Theme.SYSTEM;
  }
}

// Set theme preference
export function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

// Get system preference
export function getSystemTheme() {
  if (typeof window === 'undefined') return Theme.LIGHT;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? Theme.DARK
    : Theme.LIGHT;
}

// Get effective theme (resolved system preference)
export function getEffectiveTheme() {
  const stored = getStoredTheme();
  if (stored === Theme.SYSTEM) {
    return getSystemTheme();
  }
  return stored;
}

// Apply theme to document
export function applyTheme(theme) {
  const effectiveTheme = theme === Theme.SYSTEM ? getSystemTheme() : theme;
  const root = document.documentElement;

  if (effectiveTheme === Theme.DARK) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === Theme.DARK ? '#1A1A1A' : '#2D5016'
    );
  }
}

// Initialize theme on app load
export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (getStoredTheme() === Theme.SYSTEM) {
        applyTheme(Theme.SYSTEM);
      }
    });
  }
}

// Toggle between light and dark (skip system)
export function toggleTheme() {
  const current = getEffectiveTheme();
  const newTheme = current === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  setStoredTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
}

// Cycle through all themes
export function cycleTheme() {
  const current = getStoredTheme();
  const themes = [Theme.LIGHT, Theme.DARK, Theme.SYSTEM];
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  const newTheme = themes[nextIndex];
  setStoredTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
}

// React hook for dark mode
export function useDarkMode() {
  const [theme, setTheme] = useState(getStoredTheme);
  const [effectiveTheme, setEffectiveTheme] = useState(getEffectiveTheme);

  // Update effective theme when system preference changes
  useEffect(() => {
    const updateEffective = () => {
      setEffectiveTheme(getEffectiveTheme());
    };

    // Listen for manual theme changes
    const handleThemeChange = (e) => {
      setTheme(e.detail.theme);
      updateEffective();
    };

    window.addEventListener('themeChange', handleThemeChange);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateEffective);

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      mediaQuery.removeEventListener('change', updateEffective);
    };
  }, []);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setThemeValue = useCallback((newTheme) => {
    setStoredTheme(newTheme);
    setTheme(newTheme);
    setEffectiveTheme(newTheme === Theme.SYSTEM ? getSystemTheme() : newTheme);
    applyTheme(newTheme);
  }, []);

  const toggle = useCallback(() => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
    setEffectiveTheme(newTheme);
    return newTheme;
  }, []);

  const cycle = useCallback(() => {
    const newTheme = cycleTheme();
    setTheme(newTheme);
    setEffectiveTheme(newTheme === Theme.SYSTEM ? getSystemTheme() : newTheme);
    return newTheme;
  }, []);

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === Theme.DARK,
    isLight: effectiveTheme === Theme.LIGHT,
    isSystem: theme === Theme.SYSTEM,
    setTheme: setThemeValue,
    toggle,
    cycle
  };
}

export default {
  Theme,
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  getEffectiveTheme,
  applyTheme,
  initializeTheme,
  toggleTheme,
  cycleTheme,
  useDarkMode
};
