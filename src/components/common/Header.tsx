/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenThemeSelector: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenThemeSelector }) => {
  const { themeConfig } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F12]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          {/* Athletic Monogram badge */}
          <div className="relative w-9 h-9 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary-app transition shadow-sm">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundColor: themeConfig.primaryHex }}
            />
            <span
              className="text-xs font-black tracking-tighter"
              style={{ color: themeConfig.primaryHex }}
            >
              TC
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-wider text-white">TREINO CERTO</span>
              <span
                className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: themeConfig.primaryHex }}
              >
                v1.1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Seu treino. Sua evolução.</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install mini trigger */}
          <PWAInstallButton variant="header" />

          {/* Quick theme trigger button */}
          <button
            onClick={onOpenThemeSelector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-white/10 hover:border-primary-app text-xs text-slate-200 transition active:scale-95"
            title={`Tema atual: ${themeConfig.name}`}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
              style={{ backgroundColor: themeConfig.primaryHex }}
            />
            <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
              {themeConfig.name}
            </span>
            <Palette className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
