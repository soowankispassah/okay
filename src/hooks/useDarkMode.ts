import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeStore {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
}

export const useDarkModeStore = create<DarkModeStore>()(
  persist(
    (set) => ({
      isDarkMode: false,
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'dark-mode-storage',
    }
  )
);

export const useDarkMode = () => {
  const { isDarkMode, toggleDarkMode } = useDarkModeStore();

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Only set initial dark mode if it hasn't been set before
    if (localStorage.getItem('dark-mode-storage') === null) {
      useDarkModeStore.getState().setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
};
