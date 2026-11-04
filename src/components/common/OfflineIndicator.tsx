/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/95 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-black shadow-lg shadow-amber-500/20 border border-amber-400 max-w-[92vw] text-center">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">
        Modo Offline Ativo — Dados locais preservados (links externos e vídeos requerem internet)
      </span>
    </div>
  );
};
