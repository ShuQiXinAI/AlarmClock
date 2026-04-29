import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stats, DismissMethod } from '../types';
import { checkAchievements, checkHardSleeper, ACHIEVEMENT_IDS } from '../utils/achievements';

const DEFAULT_STATS: Stats = {
  streakDays: 0,
  totalUnlocks: 0,
  points: 0,
  methodCounts: { math: 0, blink: 0, shake: 0 },
  weeklyLog: [],
  achievements: [],
  consecutiveFailures: 0,
  consecutiveMathCorrect: 0,
};

interface StatsStore {
  stats: Stats;
  recordSuccess: (method: DismissMethod, consecutiveMathCorrect?: number) => void;
  recordFailure: () => void;
  resetConsecutiveMath: () => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      stats: DEFAULT_STATS,

      recordSuccess: (method, consecutiveMathCorrect = 0) => {
        const s = get().stats;
        const today = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().slice(0, 5);

        const lastLog = s.weeklyLog[s.weeklyLog.length - 1];
        const alreadyToday = lastLog?.date === today;
        const newStreak = alreadyToday ? s.streakDays : s.streakDays + 1;

        const newMethodCounts = {
          ...s.methodCounts,
          [method]: s.methodCounts[method] + 1,
        };

        const newStats: Stats = {
          ...s,
          totalUnlocks: s.totalUnlocks + 1,
          points: s.points + 10,
          streakDays: newStreak,
          methodCounts: newMethodCounts,
          consecutiveFailures: 0,
          consecutiveMathCorrect: method === 'math' ? consecutiveMathCorrect : s.consecutiveMathCorrect,
          weeklyLog: alreadyToday
            ? s.weeklyLog
            : [...s.weeklyLog.slice(-6), { date: today, success: true, time: timeStr }],
        };

        const newAchievements = checkAchievements(newStats, timeStr, method, consecutiveMathCorrect);
        if (newAchievements.length > 0) {
          newStats.achievements = [...newStats.achievements, ...newAchievements];
        }

        set({ stats: newStats });
      },

      recordFailure: () => {
        set(state => {
          const s = state.stats;
          const newFailures = s.consecutiveFailures + 1;
          const newAchievements = checkHardSleeper({ ...s, consecutiveFailures: newFailures })
            ? [...s.achievements, ACHIEVEMENT_IDS.HARD_SLEEPER]
            : s.achievements;
          return {
            stats: {
              ...s,
              consecutiveFailures: newFailures,
              achievements: newAchievements,
            },
          };
        });
      },

      resetConsecutiveMath: () =>
        set(s => ({ stats: { ...s.stats, consecutiveMathCorrect: 0 } })),
    }),
    { name: 'stats-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
