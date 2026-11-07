/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ChartDataPoint {
  label: string; // e.g. "01/11" or "25 Out"
  value: number; // e.g. 82.5 or 3200
  secondaryLabel?: string;
}

interface SvgLineChartProps {
  data: ChartDataPoint[];
  unit?: string;
  height?: number;
  emptyMessage?: string;
}

export const SvgLineChart: React.FC<SvgLineChartProps> = ({
  data,
  unit = '',
  height = 180,
  emptyMessage = 'Dados insuficientes para exibição do gráfico',
}) => {
  const { themeConfig } = useTheme();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center p-6 rounded-2xl bg-surface-elevated/40 border border-white/5 text-xs text-slate-400"
        style={{ minHeight: height }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Padding
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const width = 500;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + innerWidth / 2
        : padLeft + (i / (data.length - 1)) * innerWidth;
    const y = padTop + innerHeight - ((d.value - minVal) / valRange) * innerHeight;
    return { x, y, data: d };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr = `${points[0].x},${padTop + innerHeight} ${polylineStr} ${
    points[points.length - 1].x
  },${padTop + innerHeight}`;

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeConfig.primaryHex} stopOpacity="0.3" />
            <stop offset="100%" stopColor={themeConfig.primaryHex} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={width - padRight}
          y2={padTop}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="3 3"
        />
        <line
          x1={padLeft}
          y1={padTop + innerHeight / 2}
          x2={width - padRight}
          y2={padTop + innerHeight / 2}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="3 3"
        />
        <line
          x1={padLeft}
          y1={padTop + innerHeight}
          x2={width - padRight}
          y2={padTop + innerHeight}
          stroke="rgba(255,255,255,0.12)"
        />

        {/* Y Axis min/max labels */}
        <text
          x={padLeft - 8}
          y={padTop + 4}
          textAnchor="end"
          fill="#94A3B8"
          fontSize="9"
          fontFamily="sans-serif"
        >
          {maxVal.toLocaleString('pt-BR')}
        </text>
        <text
          x={padLeft - 8}
          y={padTop + innerHeight}
          textAnchor="end"
          fill="#94A3B8"
          fontSize="9"
          fontFamily="sans-serif"
        >
          {minVal.toLocaleString('pt-BR')}
        </text>

        {/* Area fill */}
        {points.length > 1 && (
          <polygon points={areaStr} fill="url(#lineChartGradient)" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={polylineStr}
            fill="none"
            stroke={themeConfig.primaryHex}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points & hit areas */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx}>
              {/* Highlight circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5.5 : 3.5}
                fill={isHovered ? '#FFFFFF' : themeConfig.primaryHex}
                stroke="#0B0F12"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />

              {/* X Axis label (selective to avoid crowding) */}
              {(points.length <= 8 ||
                idx === 0 ||
                idx === points.length - 1 ||
                idx === Math.floor(points.length / 2)) && (
                <text
                  x={p.x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {p.data.label}
                </text>
              )}

              {/* Transparent invisible click/touch target */}
              <rect
                x={p.x - 15}
                y={padTop}
                width={30}
                height={innerHeight + 10}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating active point tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-lg bg-surface-elevated border border-white/20 shadow-xl text-center text-xs backdrop-blur-md"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 8}%`,
          }}
        >
          <span className="block text-[10px] text-slate-400 font-medium">
            {hoveredPoint.data.label}
          </span>
          <span className="block font-bold text-white text-xs">
            {hoveredPoint.data.value.toLocaleString('pt-BR')} {unit}
          </span>
          {hoveredPoint.data.secondaryLabel && (
            <span className="block text-[9px] text-primary-app">
              {hoveredPoint.data.secondaryLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
