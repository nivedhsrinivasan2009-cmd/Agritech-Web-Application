// Theme Toggle Component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useDarkMode, Theme } from '@/lib/darkMode';

// Simple toggle button (light/dark only)
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useDarkMode();

  return (
    <motion.button
      onClick={toggle}
      className={`
        relative w-14 h-8 rounded-full p-1
        ${isDark ? 'bg-slate-700' : 'bg-amber-100'}
        transition-colors duration-300
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-amber-500'}`} />
        <Moon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-amber-300'}`} />
      </div>

      {/* Thumb */}
      <motion.div
        className={`
          w-6 h-6 rounded-full shadow-sm
          flex items-center justify-center
          ${isDark ? 'bg-slate-900' : 'bg-white'}
        `}
        layout
        animate={{ x: isDark ? 22 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-slate-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

// Three-way toggle (light/dark/system)
export function ThemeSelector({ className = '' }) {
  const { theme, setTheme, effectiveTheme } = useDarkMode();

  const options = [
    { value: Theme.LIGHT, icon: Sun, label: 'Light' },
    { value: Theme.DARK, icon: Moon, label: 'Dark' },
    { value: Theme.SYSTEM, icon: Monitor, label: 'System' }
  ];

  return (
    <div className={`flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg ${className}`}>
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-md
              text-sm font-medium transition-colors
              ${isSelected
                ? 'text-stone-900 dark:text-white'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }
            `}
            aria-label={option.label}
          >
            {isSelected && (
              <motion.div
                layoutId="theme-selector-bg"
                className="absolute inset-0 bg-white dark:bg-stone-700 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Icon-only button
export function ThemeIconButton({ className = '' }) {
  const { isDark, cycle, theme } = useDarkMode();

  const getIcon = () => {
    switch (theme) {
      case Theme.DARK:
        return Moon;
      case Theme.LIGHT:
        return Sun;
      default:
        return Monitor;
    }
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={cycle}
      className={`
        p-2 rounded-lg transition-colors
        hover:bg-stone-100 dark:hover:bg-stone-800
        text-stone-600 dark:text-stone-400
        ${className}
      `}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

// Settings row component
export function ThemeSettingRow({ className = '' }) {
  const { theme, setTheme, effectiveTheme } = useDarkMode();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h4 className="font-medium text-stone-900 dark:text-white">Theme</h4>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {theme === Theme.SYSTEM
            ? `System (${effectiveTheme === Theme.DARK ? 'Dark' : 'Light'})`
            : theme === Theme.DARK
            ? 'Dark'
            : 'Light'
          }
        </p>
      </div>
      <ThemeSelector />
    </div>
  );
}
