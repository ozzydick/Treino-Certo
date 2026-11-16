/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardPreview } from './components/dashboard/DashboardPreview';

// Telas secundárias são carregadas sob demanda para reduzir o JavaScript inicial.
// Os módulos continuam locais e são incluídos no build/PWA para uso offline.
const ProfileView = lazy(() =>
  import('./components/profile/ProfileView').then((module) => ({ default: module.ProfileView }))
);
const GymEquipmentsView = lazy(() =>
  import('./components/equipments/GymEquipmentsView').then((module) => ({ default: module.GymEquipmentsView }))
);
const ExerciseLibraryView = lazy(() =>
  import('./components/exercises/ExerciseLibraryView').then((module) => ({ default: module.ExerciseLibraryView }))
);
const ThemeLibraryModal = lazy(() =>
  import('./components/theme/ThemeLibraryModal').then((module) => ({ default: module.ThemeLibraryModal }))
);
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { EquipmentsProvider } from './context/EquipmentsContext';
import { CustomExercisesProvider } from './context/CustomExercisesContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { EvolutionProvider } from './context/EvolutionContext';
const WorkoutPlanView = lazy(() =>
  import('./components/workout/WorkoutPlanView').then((module) => ({ default: module.WorkoutPlanView }))
);
const EvolutionView = lazy(() =>
  import('./components/evolution/EvolutionView').then((module) => ({ default: module.EvolutionView }))
);
import { NavigationTab } from './types';

type AppViewState = {
  currentTab: NavigationTab;
  activeView: 'tabs' | 'my-gym';
  isThemeModalOpen: boolean;
  scrollY: number;
};

const REFRESH_STATE_KEY = 'treino-certo:refresh-state:v1';

function readRefreshState(): AppViewState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(REFRESH_STATE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(REFRESH_STATE_KEY);
    const state = JSON.parse(raw) as Partial<AppViewState>;
    const validTabs: NavigationTab[] = ['home', 'plan', 'exercises', 'evolution', 'profile'];
    return {
      currentTab: validTabs.includes(state.currentTab as NavigationTab) ? state.currentTab as NavigationTab : 'home',
      activeView: state.activeView === 'my-gym' ? 'my-gym' : 'tabs',
      isThemeModalOpen: state.isThemeModalOpen === true,
      scrollY: typeof state.scrollY === 'number' && Number.isFinite(state.scrollY) ? Math.max(0, state.scrollY) : 0,
    };
  } catch {
    return null;
  }
}

function MainApp() {
  const [restoredState] = useState<AppViewState | null>(() => readRefreshState());
  const [currentTab, setCurrentTab] = useState<NavigationTab>(restoredState?.currentTab ?? 'home');
  const [activeView, setActiveView] = useState<'tabs' | 'my-gym'>(restoredState?.activeView ?? 'tabs');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(restoredState?.isThemeModalOpen ?? false);

  useEffect(() => {
    if (!restoredState || restoredState.scrollY <= 0) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, restoredState.scrollY));
    return () => window.cancelAnimationFrame(frame);
  }, [restoredState]);

  const handleRefresh = () => {
    try {
      const state: AppViewState = {
        currentTab,
        activeView,
        isThemeModalOpen,
        scrollY: window.scrollY,
      };
      window.sessionStorage.setItem(REFRESH_STATE_KEY, JSON.stringify(state));
    } catch {
      // A recarga continua possível mesmo se o armazenamento da sessão estiver indisponível.
    }
    window.location.reload();
  };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveView('tabs');
    setCurrentTab(tab === 'cardio' ? 'home' : tab);
  };

  return (
    <div className="min-h-screen bg-app-dark text-slate-100 flex flex-col">
      {/* Offline Status Pill Notification */}
      <OfflineIndicator />

      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleTabChange}
        onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div
              className="min-h-[45vh] flex items-center justify-center px-6 text-sm text-slate-400"
              role="status"
              aria-live="polite"
            >
              Carregando tela...
            </div>
          }
        >
          <div
            key={activeView === 'my-gym' ? 'my-gym' : currentTab}
            className="app-route-enter"
          >
          {activeView === 'my-gym' ? (
            <GymEquipmentsView onBack={() => setActiveView('tabs')} />
          ) : (
            <>
              {currentTab === 'home' && (
                <DashboardPreview
                  onNavigate={handleTabChange}
                  onOpenThemeModal={() => setIsThemeModalOpen(true)}
                  onOpenEquipments={() => setActiveView('my-gym')}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileView
                  onOpenThemeModal={() => setIsThemeModalOpen(true)}
                  onOpenEquipments={() => setActiveView('my-gym')}
                />
              )}

              {currentTab === 'plan' && (
                <WorkoutPlanView
                  onOpenEquipments={() => setActiveView('my-gym')}
                  onNavigate={handleTabChange}
                />
              )}

              {currentTab === 'exercises' && (
                <ExerciseLibraryView
                  onOpenEquipments={() => setActiveView('my-gym')}
                />
              )}

              {currentTab === 'evolution' && (
                <EvolutionView
                  onNavigate={handleTabChange}
                  onOpenEquipments={() => setActiveView('my-gym')}
                />
              )}

              {/* Cardio module is non-homologated and removed from active navigation in CP07 */}
            </>
          )}
          </div>
        </Suspense>
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={activeView === 'my-gym' ? 'home' : currentTab}
        onTabChange={handleTabChange}
      />

      {/* Theme Customization Modal (Perfil > Aparência > Biblioteca de Temas) */}
      {isThemeModalOpen && (
        <Suspense fallback={null}>
          <ThemeLibraryModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <EquipmentsProvider>
          <CustomExercisesProvider>
            <WorkoutProvider>
              <EvolutionProvider>
                <MainApp />
              </EvolutionProvider>
            </WorkoutProvider>
          </CustomExercisesProvider>
        </EquipmentsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
