export type DismissMethod = 'math' | 'blink' | 'shake';

export interface Alarm {
  id: string;
  time: string;          // "HH:mm"
  label: string;
  method: DismissMethod;
  active: boolean;
  repeatDays: number[];  // 0=周日, 1=周一 … 6=周六; [] = 仅一次
  notifeeJobId?: string;
}

export interface WeeklyLogEntry {
  date: string;    // "YYYY-MM-DD"
  success: boolean;
  time: string;    // "HH:mm" 或 "--"
}

export interface Stats {
  streakDays: number;
  totalUnlocks: number;
  points: number;
  methodCounts: Record<DismissMethod, number>;
  weeklyLog: WeeklyLogEntry[];
  achievements: string[];
  consecutiveFailures: number;
  consecutiveMathCorrect: number;
}

export const DISMISS_METHODS: Record<DismissMethod, { label: string; emoji: string; color: string; desc: string }> = {
  math:  { label: '答题模式', emoji: '🧮', color: '#1A4FDC', desc: '做题才能解脱' },
  blink: { label: '眨眼模式', emoji: '👁️', color: '#C026A8', desc: '睁开你的猪眼' },
  shake: { label: '摇晃模式', emoji: '📳', color: '#D4830A', desc: '摇到你清醒'   },
};
