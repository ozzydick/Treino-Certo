/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, ClipboardList, Dumbbell, TrendingUp, Flame, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from '../../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { themeConfig } = useTheme();

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'plan', label: 'Ficha', icon: ClipboardList },
    { id: 'exercises', label: 'Exercícios', icon: Dumbbell },
    { id: 'evolution', label: 'Evolução', icon: TrendingUp },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F12]/95 backdrop-blur-xl border-t border-white/8 safe-bottom">
      <div className="max-w-lg mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-200 select-none group min-h-[52px]"
            >
              {/* Active glow background pill */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-15"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                />
              )}

              {/* Active top line highlight */}
              {isActive && (
                <div
                  className="absolute top-0 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                />
              )}

              {/* Icon */}
              <div className="relative mb-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                  style={isActive ? { color: themeConfig.primaryHex } : undefined}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight transition-colors duration-200 ${
                  isActive ? 'font-bold' : 'text-slate-400 font-medium'
                }`}
                style={isActive ? { color: themeConfig.primaryHex } : undefined}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
