/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_THEME_ID, THEMES } from '../constants/themes';
import { dbService, safeLocalStorageGet } from '../services/db';
import { ThemeConfig, ThemeId } from '../types';

interface ThemeContextType {
  currentThemeId: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (themeId: ThemeId) => Promise<void>;
  reloadPreferences: () => Promise<void>;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeTokens(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primaryHex);
  root.style.setProperty('--primary-light', theme.complementaryHex);
  root.style.setProperty('--primary-dark', theme.primaryDarkHex);
  root.style.setProperty('--primary-rgb', theme.rgb);
  root.style.setProperty('--primary-glow', `rgba(${theme.rgb}, 0.28)`);
  root.style.setProperty('--primary-border', `rgba(${theme.rgb}, 0.4)`);
  root.style.setProperty('--primary-surface', `rgba(${theme.rgb}, 0.12)`);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', '#0B0F12');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    const cached =
      safeLocalStorageGet('treino_certo_preferences') ||
      safeLocalStorageGet('fit_app_preferences');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.theme && THEMES[parsed.theme as ThemeId]) {
          return parsed.theme as ThemeId;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_THEME_ID;
  });

  useEffect(() => {
    const config = THEMES[currentThemeId] || THEMES[DEFAULT_THEME_ID];
    applyThemeTokens(config);
  }, [currentThemeId]);

  const loadPreferencesFromStorage = async () => {
    try {
      const prefs = await dbService.getPreferences();
      if (prefs.theme && THEMES[prefs.theme]) {
        setCurrentThemeId(prefs.theme);
        applyThemeTokens(THEMES[prefs.theme]);
      }
    } catch (e) {
      console.warn('Falha ao carregar preferências de tema:', e);
    }
  };

  useEffect(() => {
    loadPreferencesFromStorage();
  }, []);

  const setTheme = async (themeId: ThemeId) => {
    if (!THEMES[themeId]) return;
    const config = THEMES[themeId];
    applyThemeTokens(config);
    setCurrentThemeId(themeId);
    await dbService.savePreferences({ theme: themeId });
  };

  const reloadPreferences = async () => {
    await loadPreferencesFromStorage();
  };

  const themeConfig = THEMES[currentThemeId] || THEMES[DEFAULT_THEME_ID];

  return (
    <ThemeContext.Provider
      value={{
        currentThemeId,
        themeConfig,
        setTheme,
        reloadPreferences,
        availableThemes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
