import { create } from 'zustand';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  trend: number[];
  serpFeatures: string[];
  lastUpdated: string;
}

interface KeywordState {
  keywords: Map<string, KeywordData>;
  loading: boolean;
  error: string | null;

  setKeywords: (data: KeywordData[]) => void;
  addKeyword: (data: KeywordData) => void;
  clearKeywords: () => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useKeywordStore = create<KeywordState>()((set) => ({
  keywords: new Map<string, KeywordData>(),
  loading: false,
  error: null,

  setKeywords: (data) =>
    set({
      keywords: new Map(data.map((d) => [d.keyword, d])),
      error: null,
    }),

  addKeyword: (data) =>
    set((state) => {
      const next = new Map(state.keywords);
      next.set(data.keyword, data);
      return { keywords: next };
    }),

  clearKeywords: () => set({ keywords: new Map(), error: null }),

  setLoading: (v) => set({ loading: v }),

  setError: (e) => set({ error: e }),
}));
