import { checkAchievements, checkHardSleeper, ACHIEVEMENT_IDS } from '../../src/utils/achievements';
import { Stats } from '../../src/types';

const baseStats: Stats = {
  streakDays: 0,
  totalUnlocks: 0,
  points: 0,
  methodCounts: { math: 0, blink: 0, shake: 0 },
  weeklyLog: [],
  achievements: [],
  consecutiveFailures: 0,
  consecutiveMathCorrect: 0,
};

describe('checkAchievements', () => {
  it('awards first_unlock on first success', () => {
    const result = checkAchievements(baseStats, '07:00', 'math', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.FIRST_UNLOCK);
  });

  it('does not award first_unlock if already unlocked', () => {
    const stats = { ...baseStats, achievements: [ACHIEVEMENT_IDS.FIRST_UNLOCK] };
    const result = checkAchievements(stats, '07:00', 'math', 0);
    expect(result).not.toContain(ACHIEVEMENT_IDS.FIRST_UNLOCK);
  });

  it('awards early_bird for unlock before 06:00', () => {
    const result = checkAchievements(baseStats, '05:45', 'math', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.EARLY_BIRD);
  });

  it('does not award early_bird for 06:00 or later', () => {
    const result = checkAchievements(baseStats, '06:00', 'math', 0);
    expect(result).not.toContain(ACHIEVEMENT_IDS.EARLY_BIRD);
  });

  it('awards math_genius at 10 consecutive correct', () => {
    const result = checkAchievements(baseStats, '07:00', 'math', 10);
    expect(result).toContain(ACHIEVEMENT_IDS.MATH_GENIUS);
  });

  it('awards streak_7 at 7 streak days', () => {
    const stats = { ...baseStats, streakDays: 7 };
    const result = checkAchievements(stats, '07:00', 'math', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.STREAK_7);
  });

  it('awards blink_50 at 50 blink unlocks', () => {
    const stats = { ...baseStats, methodCounts: { math: 0, blink: 50, shake: 0 } };
    const result = checkAchievements(stats, '07:00', 'blink', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.BLINK_50);
  });

  it('awards shake_10k at 10000 shake unlocks', () => {
    const stats = { ...baseStats, methodCounts: { math: 0, blink: 0, shake: 10000 } };
    const result = checkAchievements(stats, '07:00', 'shake', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.SHAKE_10K);
  });

  it('awards streak_30 at 30 streak days', () => {
    const stats = { ...baseStats, streakDays: 30 };
    const result = checkAchievements(stats, '07:00', 'math', 0);
    expect(result).toContain(ACHIEVEMENT_IDS.STREAK_30);
  });
});

describe('checkHardSleeper', () => {
  it('returns true at 3 consecutive failures', () => {
    const stats = { ...baseStats, consecutiveFailures: 3 };
    expect(checkHardSleeper(stats)).toBe(true);
  });

  it('returns false if already has achievement', () => {
    const stats = { ...baseStats, consecutiveFailures: 3, achievements: [ACHIEVEMENT_IDS.HARD_SLEEPER] };
    expect(checkHardSleeper(stats)).toBe(false);
  });
});
