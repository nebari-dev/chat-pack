/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import { useEffect, useState } from 'react';

import { useLocalStorageState } from './uselocalstoragestate';

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value);
}

/**
 * The localStorage key under which the theme preference is persisted. Kept in
 * sync with the inline bootstrap script in `index.html` that prevents a flash
 * of the wrong theme on initial load.
 */
export const THEME_MODE_STORAGE_KEY = 'nebari-chat:themeMode';

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function readStoredMode(raw: string | null): ThemeMode {
  if (raw !== null && isThemeMode(raw)) {
    return raw;
  }

  return 'system';
}

/**
 * Track the user's theme preference, persist it, and keep the root `dark` class
 * in sync so the whole app responds. In `system` mode the OS preference is
 * followed live via `prefers-color-scheme`.
 */
export function useThemePreference() {
  const [themeMode, setThemeMode] = useLocalStorageState<ThemeMode>(
    THEME_MODE_STORAGE_KEY,
    readStoredMode,
  );
  const [systemPrefersDark, setSystemPrefersDark] =
    useState<boolean>(prefersDark);

  // Keep "system" mode in sync with the OS preference as it changes.
  useEffect(() => {
    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }

    const onChange = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const isDarkMode =
    themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return { themeMode, isDarkMode, setThemeMode };
}
