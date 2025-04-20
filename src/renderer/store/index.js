import { create } from "zustand";
import useThemeStore from "./themeStore";

const useAwsStore = create((set) => ({
  credentials: null,
  setCredentials: (credentials) => set({ credentials }),
}));

export { useThemeStore, useAwsStore };
