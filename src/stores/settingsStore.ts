import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  model: string;
  language: string; // ISO 639-1, empty = auto-detect
  apiUrl: string;
  setModel: (m: string) => void;
  setLanguage: (l: string) => void;
  setApiUrl: (u: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      model: "base",
      language: "",
      apiUrl: "",
      setModel: (model) => set({ model }),
      setLanguage: (language) => set({ language }),
      setApiUrl: (apiUrl) => set({ apiUrl }),
    }),
    { name: "voicebox-stt-settings" },
  ),
);
