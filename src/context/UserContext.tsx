/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_THEME_ID } from '../constants/themes';
import { dbService } from '../services/db';
import { UserPreferences, UserProfile } from '../types';

interface UserContextType {
  profile: UserProfile;
  preferences: UserPreferences;
  isLoading: boolean;
  isProfileConfigured: boolean;
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  savePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'current_preferences',
  theme: DEFAULT_THEME_ID,
  soundAlerts: true,
  vibration: true,
  restTimerDefaultSeconds: 60,
  keepScreenAwake: true,
  updatedAt: new Date().toISOString(),
};

// Initial clean state strictly without any fictitious or mock data
const EMPTY_INITIAL_PROFILE: UserProfile = {
  id: 'current_user',
  name: '',
  birthDate: undefined,
  height: undefined,
  weight: undefined,
  goal: undefined,
  gymName: '',
  weeklyFrequency: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_INITIAL_PROFILE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileFromStorage = async () => {
    try {
      const [storedProfile, storedPrefs] = await Promise.all([
        dbService.getProfile(),
        dbService.getPreferences(),
      ]);
      if (storedProfile) {
        setProfile(storedProfile);
      } else {
        setProfile(EMPTY_INITIAL_PROFILE);
      }
      if (storedPrefs) {
        setPreferences(storedPrefs);
      }
    } catch (err) {
      console.error('Falha ao carregar perfil/preferências:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileFromStorage();
  }, []);

  const saveProfile = async (updates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveProfile(updated);
    setProfile(updated);
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    const updated = await dbService.savePreferences(updates);
    setPreferences(updated);
  };

  const reloadProfile = async () => {
    await fetchProfileFromStorage();
  };

  const isProfileConfigured = Boolean(profile.name && profile.name.trim().length > 0);

  return (
    <UserContext.Provider
      value={{
        profile,
        preferences,
        isLoading,
        isProfileConfigured,
        saveProfile,
        savePreferences,
        reloadProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
