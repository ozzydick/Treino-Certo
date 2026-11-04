/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeConfig, ThemeId } from '../types';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  orange: {
    id: 'orange',
    name: 'ORANGE',
    label: 'Laranja Elétrico',
    primaryHex: '#FF7A1A',
    complementaryHex: '#FFAB52',
    primaryDarkHex: '#D45C05',
    rgb: '255, 122, 26',
    description: 'Energia, potência e explosão muscular. O tema padrão de alta performance.',
  },
  green: {
    id: 'green',
    name: 'GREEN',
    label: 'Verde Esmeralda',
    primaryHex: '#10B981',
    complementaryHex: '#6EE7B7',
    primaryDarkHex: '#059669',
    rgb: '16, 185, 129',
    description: 'Equilíbrio, resistência prolongada e vitalidade atlética contínua.',
  },
  blue: {
    id: 'blue',
    name: 'BLUE',
    label: 'Azul Cobalto',
    primaryHex: '#3B82F6',
    complementaryHex: '#93C5FD',
    primaryDarkHex: '#1D4ED8',
    rgb: '59, 130, 246',
    description: 'Foco cirúrgico, concentração absoluta e precisão biomecânica.',
  },
  purple: {
    id: 'purple',
    name: 'PURPLE',
    label: 'Roxo Royal',
    primaryHex: '#A855F7',
    complementaryHex: '#C084FC',
    primaryDarkHex: '#7E22CE',
    rgb: '168, 85, 247',
    description: 'Sofisticação, disciplina de ferro e mentalidade de superação.',
  },
  red: {
    id: 'red',
    name: 'RED',
    label: 'Vermelho Fúria',
    primaryHex: '#EF4444',
    complementaryHex: '#FCA5A5',
    primaryDarkHex: '#B91C1C',
    rgb: '239, 68, 68',
    description: 'Adrenalina pura, força máxima e atitude inabalável sob a barra.',
  },
  gold: {
    id: 'gold',
    name: 'GOLD',
    label: 'Dourado Prestige',
    primaryHex: '#D6A348',
    complementaryHex: '#F4D58D',
    primaryDarkHex: '#9E7226',
    rgb: '214, 163, 72',
    description: 'Padrão ouro, prestígio exclusivo e evolução de alto escalão.',
  },
};

export const THEME_LIST = Object.values(THEMES);
export const DEFAULT_THEME_ID: ThemeId = 'orange';
