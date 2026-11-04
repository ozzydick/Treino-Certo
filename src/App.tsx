/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardPreview } from './components/dashboard/DashboardPreview';
import { ProfileView } from './components/profile/ProfileView';
import { SectionPlaceholder } from './components/placeholders/SectionPlaceholder';
import { GymEquipmentsView } from './components/equipments/GymEquipmentsView';
import { ExerciseLibraryView } from './components/exercises/ExerciseLibraryView';
import { ThemeLibraryModal } from './components/theme/ThemeLibraryModal';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { EquipmentsProvider } from './context/EquipmentsContext';
import { NavigationTab } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeView, setActiveView] = useState<'tabs' | 'my-gym'>('tabs');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const handleTabChange = (tab: NavigationTab) => {
    setActiveView('tabs');
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-app-dark text-slate-100 flex flex-col selection:bg-white/20 selection:text-white">
      {/* Offline Status Pill Notification */}
      <OfflineIndicator />

      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleTabChange}
        onOpenThemeSelector={() => setIsThemeModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
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
              <SectionPlaceholder
                tab="plan"
                onNavigate={handleTabChange}
                onOpenThemeModal={() => setIsThemeModalOpen(true)}
                onOpenEquipments={() => setActiveView('my-gym')}
              />
            )}

            {currentTab === 'exercises' && (
              <ExerciseLibraryView
                onOpenEquipments={() => setActiveView('my-gym')}
              />
            )}

            {currentTab === 'cardio' && (
              <SectionPlaceholder
                tab="cardio"
                onNavigate={handleTabChange}
                onOpenThemeModal={() => setIsThemeModalOpen(true)}
                onOpenEquipments={() => setActiveView('my-gym')}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation (5 tabs) */}
      <BottomNav
        currentTab={activeView === 'my-gym' ? 'home' : currentTab}
        onTabChange={handleTabChange}
      />

      {/* Theme Customization Modal (Perfil > Aparência > Biblioteca de Temas) */}
      <ThemeLibraryModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <EquipmentsProvider>
          <MainApp />
        </EquipmentsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
