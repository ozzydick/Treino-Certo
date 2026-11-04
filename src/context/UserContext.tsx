/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface UserContextType {
  profile: UserProfile;
  isLoading: boolean;
  isProfileConfigured: boolean;
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileFromStorage = async () => {
    try {
      const stored = await dbService.getProfile();
      if (stored) {
        setProfile(stored);
      } else {
        // App starts clean with empty initial profile
        setProfile(EMPTY_INITIAL_PROFILE);
      }
    } catch (err) {
      console.error('Falha ao carregar perfil:', err);
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
    // Wait for real persistence confirmation before updating React state
    await dbService.saveProfile(updated);
    setProfile(updated);
  };

  const reloadProfile = async () => {
    await fetchProfileFromStorage();
  };

  const isProfileConfigured = Boolean(profile.name && profile.name.trim().length > 0);

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        isProfileConfigured,
        saveProfile,
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
