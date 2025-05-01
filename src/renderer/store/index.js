import { create } from 'zustand';
import useThemeStore from './themeStore';
import useInstanceStore from './instanceStore';

const useAwsStore = create(set => ({
  credentials: null,
  setCredentials: credentials => set({ credentials }),
}));

export { useThemeStore, useAwsStore, useInstanceStore };
