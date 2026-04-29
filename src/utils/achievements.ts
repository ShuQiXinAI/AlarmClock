import { Stats } from '../types';

export const ACHIEVEMENT_IDS = {
  FIRST_UNLOCK:  'first_unlock',
  EARLY_BIRD:    'early_bird',
  MATH_GENIUS:   'math_genius',
  STREAK_7:      'streak_7',
  SHAKE_10K:     'shake_10k',
  BLINK_50:      'blink_50',
  STREAK_30:     'streak_30',
  HARD_SLEEPER:  'hard_sleeper',
} as const;

export const ACHIEVEMENTS = [
  { id: ACHIEVEMENT_IDS.FIRST_UNLOCK,  emoji: '🎖️', name: '初出茅庐',   desc: '第一次成功解锁闹钟' },
  { id: ACHIEVEMENT_IDS.EARLY_BIRD,    emoji: '☕',  name: '早起的鸟儿', desc: '6点前起床一次' },
  { id: ACHIEVEMENT_IDS.MATH_GENIUS,   emoji: '🧮',  name: '数学天才',   desc: '答题正确率100%（连续10次）' },
  { id: ACHIEVEMENT_IDS.STREAK_7,      emoji: '🏆',  name: '卧薪尝胆',   desc: '连续7天准时起床' },
  { id: ACHIEVEMENT_IDS.SHAKE_10K,     emoji: '💪',  name: '摇摇先生',   desc: '累计摇晃10000次' },
  { id: ACHIEVEMENT_IDS.BLINK_50,      emoji: '👁️', name: '千里眼',     desc: '眨眼解锁累计50次' },
  { id: ACHIEVEMENT_IDS.STREAK_30,     emoji: '🌟',  name: '卷王之王',   desc: '连续30天准时打卡' },
  { id: ACHIEVEMENT_IDS.HARD_SLEEPER,  emoji: '😴',  name: '起床困难户', desc: '连续失败3次（还要继续加油）' },
];

export function checkAchievements(
  stats: Stats,
  unlockTime: string,
  method: string,
  consecutiveMathCorrect: number,
): string[] {
  const earned: string[] = [];
  const has = (id: string) => stats.achievements.includes(id);

  if (!has(ACHIEVEMENT_IDS.FIRST_UNLOCK) && stats.totalUnlocks === 0) {
    earned.push(ACHIEVEMENT_IDS.FIRST_UNLOCK);
  }
  const [h] = unlockTime.split(':').map(Number);
  if (!has(ACHIEVEMENT_IDS.EARLY_BIRD) && h < 6) {
    earned.push(ACHIEVEMENT_IDS.EARLY_BIRD);
  }
  if (!has(ACHIEVEMENT_IDS.MATH_GENIUS) && consecutiveMathCorrect >= 10) {
    earned.push(ACHIEVEMENT_IDS.MATH_GENIUS);
  }
  if (!has(ACHIEVEMENT_IDS.STREAK_7) && stats.streakDays >= 7) {
    earned.push(ACHIEVEMENT_IDS.STREAK_7);
  }
  if (!has(ACHIEVEMENT_IDS.STREAK_30) && stats.streakDays >= 30) {
    earned.push(ACHIEVEMENT_IDS.STREAK_30);
  }
  if (!has(ACHIEVEMENT_IDS.BLINK_50) && stats.methodCounts.blink >= 50) {
    earned.push(ACHIEVEMENT_IDS.BLINK_50);
  }
  if (!has(ACHIEVEMENT_IDS.SHAKE_10K) && stats.methodCounts.shake >= 10000) {
    earned.push(ACHIEVEMENT_IDS.SHAKE_10K);
  }
  return earned;
}

export function checkHardSleeper(stats: Stats): boolean {
  return stats.consecutiveFailures >= 3 &&
    !stats.achievements.includes(ACHIEVEMENT_IDS.HARD_SLEEPER);
}
