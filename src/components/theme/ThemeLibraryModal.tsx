/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Sparkles, X, Shield, ArrowRight, Eye } from 'lucide-react';
import { THEMES } from '../../constants/themes';
import { useTheme } from '../../context/ThemeContext';
import { ThemeConfig, ThemeId } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeLibraryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentThemeId, setTheme, availableThemes } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(currentThemeId);
  const [justApplied, setJustApplied] = useState(false);

  if (!isOpen) return null;

  const previewTheme: ThemeConfig = THEMES[selectedThemeId] || THEMES[currentThemeId];
  const isCurrentlyActive = selectedThemeId === currentThemeId;

  const handleApply = async (themeId: ThemeId) => {
    setSelectedThemeId(themeId);
    await setTheme(themeId);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#0F141B] border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141B24]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `rgba(${previewTheme.rgb}, 0.2)` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: previewTheme.primaryHex }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Biblioteca de Temas
              </h2>
              <p className="text-xs text-slate-400">Perfil &gt; Aparência &gt; Temas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-surface-card border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" style={{ color: previewTheme.primaryHex }} />
                Amostra de Cores e Contraste: {previewTheme.name}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-black uppercase tracking-wider"
                style={{ backgroundColor: previewTheme.primaryHex }}
              >
                {previewTheme.label}
              </span>
            </div>

            {/* Mini Simulated UI */}
            <div className="rounded-xl bg-[#090D11] border border-white/10 p-3.5 space-y-3">
              {/* Header simulation */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-black"
                    style={{ backgroundColor: previewTheme.primaryHex }}
                  >
                    F
                  </div>
                  <span className="text-xs font-bold text-white">Treino A • Peito & Tríceps</span>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                  style={{
                    color: previewTheme.complementaryHex,
                    borderColor: `rgba(${previewTheme.rgb}, 0.3)`,
                    backgroundColor: `rgba(${previewTheme.rgb}, 0.1)`,
                  }}
                >
                  Série 3 de 4
                </span>
              </div>

              {/* Progress bar demonstration */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Progresso do Treino</span>
                  <span style={{ color: previewTheme.complementaryHex }} className="font-semibold">
                    75%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: '75%',
                      backgroundColor: previewTheme.primaryHex,
                      boxShadow: `0 0 10px rgba(${previewTheme.rgb}, 0.6)`,
                    }}
                  />
                </div>
              </div>

              {/* Action buttons preview */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className="py-2 px-3 rounded-xl text-center text-xs font-bold text-black uppercase tracking-wider transition"
                  style={{
                    backgroundColor: previewTheme.primaryHex,
                    boxShadow: `0 2px 12px rgba(${previewTheme.rgb}, 0.35)`,
                  }}
                >
                  Concluir Série
                </button>
                <div
                  className="py-2 px-3 rounded-xl text-center text-xs font-semibold border flex items-center justify-center gap-1.5"
                  style={{
                    color: previewTheme.complementaryHex,
                    borderColor: `rgba(${previewTheme.rgb}, 0.4)`,
                    backgroundColor: `rgba(${previewTheme.rgb}, 0.08)`,
                  }}
                >
                  <span>Descanso: 60s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selecione uma identidade visual (6 temas disponíveis)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableThemes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                const isAppActive = currentThemeId === theme.id;

                return (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-surface-elevated border-white/30 ring-2'
                        : 'bg-surface-card border-white/5 hover:border-white/20'
                    }`}
                    style={isSelected ? { borderColor: theme.primaryHex } : undefined}
                  >
                    {/* Header: Name and Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {/* Dual Color Swatch */}
                        <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/20 shadow-inner flex shrink-0">
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: theme.primaryHex }}
                          />
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: theme.complementaryHex }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{theme.name}</span>
                            {isAppActive && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black uppercase"
                                style={{ backgroundColor: theme.primaryHex }}
                              >
                                Ativo
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{theme.label}</span>
                        </div>
                      </div>

                      {/* Radio / Check indicator */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                          isSelected
                            ? 'border-transparent text-black'
                            : 'border-white/20 text-transparent'
                        }`}
                        style={isSelected ? { backgroundColor: theme.primaryHex } : undefined}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Quick Apply Button on each card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(theme.id);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                        isAppActive
                          ? 'bg-white/5 text-slate-400 border border-white/10 cursor-default'
                          : 'text-black'
                      }`}
                      style={
                        !isAppActive
                          ? {
                              backgroundColor: theme.primaryHex,
                              boxShadow: `0 2px 10px rgba(${theme.rgb}, 0.25)`,
                            }
                          : undefined
                      }
                      disabled={isAppActive}
                    >
                      {isAppActive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Tema em uso
                        </>
                      ) : (
                        <>
                          <span>Aplicar {theme.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee of semantic colors */}
          <div className="p-3.5 rounded-2xl bg-surface-card border border-white/5 flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-white">Preservação Semântica:</strong> A cor do tema é
              aplicada aos elementos de destaque, botões principais e indicadores de progresso.
              Verde (sucesso), vermelho (alertas) e amarelo (avisos) permanecem estritamente
              inalterados para manter a integridade operacional e segurança.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 bg-[#141B24] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {justApplied ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Tema {previewTheme.name} aplicado com sucesso!
              </span>
            ) : (
              <span>Tema selecionado: <strong className="text-white">{previewTheme.name}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentlyActive ? (
              <button
                onClick={() => handleApply(selectedThemeId)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition"
                style={{
                  backgroundColor: previewTheme.primaryHex,
                  boxShadow: `0 4px 15px rgba(${previewTheme.rgb}, 0.4)`,
                }}
              >
                Aplicar Tema
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-surface-elevated border border-white/10 text-white hover:border-primary-app transition"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
