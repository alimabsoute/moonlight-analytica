import { create } from 'zustand';
import {
  subDays,
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  differenceInDays,
} from 'date-fns';

type CompareMode = 'previous-period' | 'yoy' | 'custom';

interface DateRangeState {
  startDate: Date;
  endDate: Date;
  compareEnabled: boolean;
  compareStartDate: Date | null;
  compareEndDate: Date | null;
  preset: string;
  compareMode: CompareMode;

  setDateRange: (start: Date, end: Date) => void;
  setPreset: (preset: string) => void;
  toggleCompare: () => void;
  setCompareMode: (mode: CompareMode) => void;
  setCompareRange: (start: Date, end: Date) => void;
}

function calcPresetRange(preset: string): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case 'last-7d':
      return { start: startOfDay(subDays(now, 6)), end: todayEnd };
    case 'last-14d':
      return { start: startOfDay(subDays(now, 13)), end: todayEnd };
    case 'last-28d':
      return { start: startOfDay(subDays(now, 27)), end: todayEnd };
    case 'last-30d':
      return { start: startOfDay(subDays(now, 29)), end: todayEnd };
    case 'last-90d':
      return { start: startOfDay(subDays(now, 89)), end: todayEnd };
    case 'this-month':
      return { start: startOfMonth(now), end: todayEnd };
    case 'last-month': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case 'this-quarter':
      return { start: startOfQuarter(now), end: todayEnd };
    case 'this-year':
      return { start: startOfYear(now), end: todayEnd };
    case 'last-year': {
      const ly = subYears(now, 1);
      return { start: startOfYear(ly), end: endOfYear(ly) };
    }
    case 'all-time':
      return { start: new Date(2020, 0, 1), end: todayEnd };
    default:
      return { start: startOfDay(subDays(now, 29)), end: todayEnd };
  }
}

function calcCompareRange(
  start: Date,
  end: Date,
  mode: CompareMode,
): { compareStart: Date; compareEnd: Date } {
  switch (mode) {
    case 'previous-period': {
      const days = differenceInDays(end, start);
      const compareEnd = subDays(start, 1);
      const compareStart = subDays(compareEnd, days);
      return { compareStart: startOfDay(compareStart), compareEnd: endOfDay(compareEnd) };
    }
    case 'yoy':
      return {
        compareStart: subYears(start, 1),
        compareEnd: subYears(end, 1),
      };
    case 'custom':
      return { compareStart: start, compareEnd: end };
    default:
      return { compareStart: start, compareEnd: end };
  }
}

const defaultRange = calcPresetRange('last-30d');

const useDateRangeStore = create<DateRangeState>()((set, get) => ({
  startDate: defaultRange.start,
  endDate: defaultRange.end,
  compareEnabled: false,
  compareStartDate: null,
  compareEndDate: null,
  preset: 'last-30d',
  compareMode: 'previous-period' as CompareMode,

  setDateRange: (start, end) =>
    set((state) => {
      const result: Partial<DateRangeState> = {
        startDate: start,
        endDate: end,
        preset: 'custom',
      };
      if (state.compareEnabled && state.compareMode !== 'custom') {
        const { compareStart, compareEnd } = calcCompareRange(
          start,
          end,
          state.compareMode,
        );
        result.compareStartDate = compareStart;
        result.compareEndDate = compareEnd;
      }
      return result;
    }),

  setPreset: (preset) =>
    set((state) => {
      const { start, end } = calcPresetRange(preset);
      const result: Partial<DateRangeState> = {
        startDate: start,
        endDate: end,
        preset,
      };
      if (state.compareEnabled && state.compareMode !== 'custom') {
        const { compareStart, compareEnd } = calcCompareRange(
          start,
          end,
          state.compareMode,
        );
        result.compareStartDate = compareStart;
        result.compareEndDate = compareEnd;
      }
      return result;
    }),

  toggleCompare: () =>
    set((state) => {
      const enabled = !state.compareEnabled;
      if (enabled) {
        const { compareStart, compareEnd } = calcCompareRange(
          state.startDate,
          state.endDate,
          state.compareMode,
        );
        return {
          compareEnabled: true,
          compareStartDate: compareStart,
          compareEndDate: compareEnd,
        };
      }
      return {
        compareEnabled: false,
        compareStartDate: null,
        compareEndDate: null,
      };
    }),

  setCompareMode: (mode) =>
    set(() => {
      const state = get();
      if (mode === 'custom') {
        return { compareMode: mode };
      }
      const { compareStart, compareEnd } = calcCompareRange(
        state.startDate,
        state.endDate,
        mode,
      );
      return {
        compareMode: mode,
        compareStartDate: compareStart,
        compareEndDate: compareEnd,
      };
    }),

  setCompareRange: (start, end) =>
    set({
      compareStartDate: start,
      compareEndDate: end,
      compareMode: 'custom' as CompareMode,
    }),
}));

export function useDateRange() {
  return useDateRangeStore();
}
