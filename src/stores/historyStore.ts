import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TranscriptionSegment } from "@/lib/api";

export interface HistoryItem {
  id: string;
  createdAt: number;
  text: string;
  language: string | null;
  duration: number;
  model: string;
  source: "dictate" | "upload";
  filename?: string;
  segments?: TranscriptionSegment[];
}

interface HistoryState {
  items: HistoryItem[];
  add: (item: Omit<HistoryItem, "id" | "createdAt">) => HistoryItem;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (partial) => {
        const item: HistoryItem = {
          ...partial,
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ items: [item, ...s.items].slice(0, 200) }));
        return item;
      },
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "voicebox-stt-history" },
  ),
);
