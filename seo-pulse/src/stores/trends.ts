import { create } from 'zustand';

export interface PulseScore {
  keyword: string;
  score: number;
  velocity: number;
  googleTrends: number;
  redditMentions: number;
  newsCount: number;
  confidence: number;
  updatedAt: string;
}

export interface TrendPrediction {
  keyword: string;
  predictedPeak: string;
  currentScore: number;
  peakScore: number;
  confidence: number;
  direction: 'rising' | 'peaking' | 'declining' | 'stable';
}

interface TrendsState {
  pulseScores: Map<string, PulseScore>;
  predictions: TrendPrediction[];
  loading: boolean;

  setPulseScores: (scores: PulseScore[]) => void;
  addPulseScore: (score: PulseScore) => void;
  setPredictions: (preds: TrendPrediction[]) => void;
  setLoading: (v: boolean) => void;
}

export const useTrendsStore = create<TrendsState>()((set) => ({
  pulseScores: new Map<string, PulseScore>(),
  predictions: [],
  loading: false,

  setPulseScores: (scores) =>
    set({
      pulseScores: new Map(scores.map((s) => [s.keyword, s])),
    }),

  addPulseScore: (score) =>
    set((state) => {
      const next = new Map(state.pulseScores);
      next.set(score.keyword, score);
      return { pulseScores: next };
    }),

  setPredictions: (preds) => set({ predictions: preds }),

  setLoading: (v) => set({ loading: v }),
}));
