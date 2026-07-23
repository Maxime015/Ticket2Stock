import { create } from "zustand";

import type { ScanResult } from "../services/tickets";

/**
 * Porte le résultat d'un scan entre l'écran d'accueil et l'écran de
 * revue du ticket (évite de sérialiser tout le JSON dans l'URL).
 */
type ScanStore = {
  result: ScanResult | null;
  setResult: (result: ScanResult) => void;
  updateArticle: (index: number, patch: Partial<ScanResult["articles"][number]>) => void;
  removeArticle: (index: number) => void;
  clear: () => void;
};

export const useScanStore = create<ScanStore>((set) => ({
  result: null,

  setResult: (result) => set({ result }),

  updateArticle: (index, patch) =>
    set((state) => {
      if (!state.result) return state;
      const articles = state.result.articles.map((article, i) =>
        i === index ? { ...article, ...patch } : article,
      );
      return { result: { ...state.result, articles } };
    }),

  removeArticle: (index) =>
    set((state) => {
      if (!state.result) return state;
      const articles = state.result.articles.filter((_, i) => i !== index);
      return { result: { ...state.result, articles } };
    }),

  clear: () => set({ result: null }),
}));
