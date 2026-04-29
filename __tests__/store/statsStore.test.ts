// __tests__/store/statsStore.test.ts
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useStatsStore } from '../../src/store/statsStore';

const DEFAULT_STATS = {
  streakDays: 0,
  totalUnlocks: 0,
  points: 0,
  methodCounts: { math: 0, blink: 0, shake: 0 },
  weeklyLog: [],
  achievements: [],
  consecutiveFailures: 0,
  consecutiveMathCorrect: 0,
};

describe('statsStore', () => {
  beforeEach(() => {
    useStatsStore.setState({ stats: { ...DEFAULT_STATS } });
  });

  it('starts with default stats', () => {
    const { result } = renderHook(() => useStatsStore());
    expect(result.current.stats.totalUnlocks).toBe(0);
    expect(result.current.stats.points).toBe(0);
    expect(result.current.stats.streakDays).toBe(0);
    expect(result.current.stats.consecutiveFailures).toBe(0);
  });

  it('recordSuccess increments totalUnlocks and points', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordSuccess('math', 0);
    });
    expect(result.current.stats.totalUnlocks).toBe(1);
    expect(result.current.stats.points).toBe(10);
  });

  it('recordSuccess increments method count', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordSuccess('shake', 0);
    });
    expect(result.current.stats.methodCounts.shake).toBe(1);
    expect(result.current.stats.methodCounts.math).toBe(0);
  });

  it('recordSuccess resets consecutiveFailures', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
    });
    expect(result.current.stats.consecutiveFailures).toBe(2);
    act(() => {
      result.current.recordSuccess('blink', 0);
    });
    expect(result.current.stats.consecutiveFailures).toBe(0);
  });

  it('recordFailure increments consecutiveFailures', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.stats.consecutiveFailures).toBe(1);
    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.stats.consecutiveFailures).toBe(2);
  });

  it('recordFailure grants HARD_SLEEPER achievement at 3 consecutive failures', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
    });
    expect(result.current.stats.achievements).toContain('hard_sleeper');
  });

  it('resetConsecutiveMath sets consecutiveMathCorrect to 0', () => {
    const { result } = renderHook(() => useStatsStore());
    act(() => {
      result.current.recordSuccess('math', 5);
    });
    expect(result.current.stats.consecutiveMathCorrect).toBe(5);
    act(() => {
      result.current.resetConsecutiveMath();
    });
    expect(result.current.stats.consecutiveMathCorrect).toBe(0);
  });
});
