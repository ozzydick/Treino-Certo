/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, CheckCircle, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  variant?: 'header' | 'card' | 'compact';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'card' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    try {
      setIsInstalling(true);
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    if (variant === 'header') return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Aplicativo instalado (PWA Standalone)</span>
      </div>
    );
  }

  // Header compact trigger
  if (variant === 'header') {
    if (isInstallable) {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated text-xs font-medium text-slate-200 border border-white/10 hover:border-primary-app transition active:scale-95"
          title="Instalar TREINO CERTO na tela inicial"
        >
          <Download className="w-3.5 h-3.5 text-primary-app" />
          <span className="hidden sm:inline">Instalar</span>
        </button>
      );
    }
    if (isIOS) {
      return (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated text-xs font-medium text-slate-200 border border-white/10 hover:border-primary-app transition active:scale-95"
          title="Instalar no iPhone"
        >
          <Download className="w-3.5 h-3.5 text-primary-app" />
          <span className="hidden sm:inline">Instalar iOS</span>
        </button>
      );
    }
    return null;
  }

  // Card variant (e.g. inside Profile or Settings)
  return (
    <>
      <div className="p-4 rounded-2xl bg-surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center shrink-0 border border-primary-app/30">
            <Download className="w-5 h-5 text-primary-app" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Instalar TREINO CERTO (PWA)</h4>
            <p className="text-xs text-slate-400">
              Acesso instantâneo sem barra de navegação, 100% offline no Android e iOS.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary-app text-black font-bold text-xs uppercase tracking-wider glow-primary-sm hover:opacity-95 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isInstalling ? 'Instalando...' : 'Instalar Agora'}
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-white font-semibold text-xs hover:border-primary-app transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Share className="w-4 h-4 text-primary-app" />
              Instalar no iPhone
            </button>
          ) : (
            <span className="text-xs text-slate-400 bg-surface-elevated px-3 py-1.5 rounded-lg border border-white/5 inline-block text-center">
              Pronto para PWA
            </span>
          )}
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#121820] border border-white/15 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-primary-surface flex items-center justify-center border border-primary-app/30 mb-4">
              <Download className="w-6 h-6 text-primary-app" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">Como instalar no iPhone/iPad</h3>
            <p className="text-xs text-slate-400 mb-4">
              O Safari no iOS adiciona o aplicativo nativamente à sua tela de início:
            </p>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-app shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  No rodapé do Safari, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima <Share className="w-3.5 h-3.5 inline mx-0.5 text-primary-app" />).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-app shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-primary-app" />).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary-app shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-white text-xs font-semibold hover:border-primary-app transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
