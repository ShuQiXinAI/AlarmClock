# 叫不醒你不罢休 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "叫不醒你不罢休"，一款 Android 趣味闹钟 App，用户必须完成答题/眨眼/摇晃挑战才能关闭闹铃。

**Architecture:** React Native + Expo 托管工作流，8 个界面通过 React Navigation 导航，Zustand + AsyncStorage 持久化闹钟数据，notifee 驱动精确 Android 闹钟触发（全屏 Intent + 锁屏唤醒），expo-sensors 实现真实摇晃检测，expo-camera + expo-face-detector 实现眨眼检测。

**Tech Stack:** React Native 0.75, Expo SDK 51, React Navigation 7, Zustand 4, notifee 7, expo-av, expo-sensors, expo-camera, expo-face-detector, expo-font, expo-linear-gradient, @react-native-async-storage/async-storage, Jest, @testing-library/react-native

---

## File Map

```
AlarmClock/
  app.json                          # Expo 配置，权限声明
  App.tsx                           # 根组件，字体加载，NavigationContainer
  src/
    types.ts                        # 所有共享类型（Alarm, Stats, DismissMethod）
    theme/
      colors.ts                     # 品牌色常量（hex/rgba，oklch 转换值）
      typography.ts                 # 字体族、字重、尺寸常量
    utils/
      alarmTime.ts                  # getNextTriggerTimestamp()
      achievements.ts               # checkAchievements(), ACHIEVEMENT_IDS
    store/
      alarmStore.ts                 # Zustand store：闹钟 CRUD + notifee 调度
      statsStore.ts                 # Zustand store：战绩、积分、成就
    services/
      notifeeService.ts             # scheduleAlarm(), cancelAlarm(), setupNotifee()
    hooks/
      useShake.ts                   # Accelerometer → 摇晃计数
      useBlink.ts                   # Camera FaceDetector → 眨眼计数
    components/
      ToggleSwitch.tsx              # 开关组件
      DismissBadge.tsx              # 解锁方式标签
      BackButton.tsx                # 返回按钮
      SectionLabel.tsx              # 分区标题
      AlarmCard.tsx                 # 闹钟列表卡片
    screens/
      HomeScreen.tsx                # 主页：实时时钟 + 闹钟列表
      EditAlarmScreen.tsx           # 新建/编辑闹钟
      RingingScreen.tsx             # 响铃中全屏界面
      MathUnlockScreen.tsx          # 答题解锁
      BlinkUnlockScreen.tsx         # 眨眼解锁
      ShakeUnlockScreen.tsx         # 摇晃解锁
      SuccessScreen.tsx             # 解锁成功
      StatsScreen.tsx               # 统计/成就
    navigation/
      AppNavigator.tsx              # Stack + Tab 导航树
  __tests__/
    utils/
      alarmTime.test.ts
      achievements.test.ts
    store/
      alarmStore.test.ts
      statsStore.test.ts
    components/
      ToggleSwitch.test.tsx
      DismissBadge.test.tsx
    screens/
      MathUnlockScreen.test.tsx
      ShakeUnlockScreen.test.tsx
      BlinkUnlockScreen.test.tsx
```

---

## Task 1: 初始化 Expo 项目并安装依赖

**Files:**
- Create: `app.json`
- Create: `package.json`
- Create: `App.tsx`（占位）

- [ ] **Step 1: 在项目目录初始化 Expo**

```bash
cd "C:\Users\snowshine\Desktop\Program\App\AlarmClock"
npx create-expo-app@latest . --template blank-typescript
```

提示已有文件时选 **Yes** 合并（不会覆盖 `docs/` 和 `alarmclock-app/`）。

- [ ] **Step 2: 安装核心导航依赖**

```bash
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

- [ ] **Step 3: 安装状态管理和持久化**

```bash
npx expo install zustand @react-native-async-storage/async-storage
```

- [ ] **Step 4: 安装原生功能依赖**

```bash
npx expo install @notifee/react-native expo-av expo-sensors expo-camera expo-font expo-linear-gradient
```

- [ ] **Step 5: 安装测试依赖**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

- [ ] **Step 6: 更新 package.json 中的 jest 配置**

在 `package.json` 中找到或添加：
```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)"
    ]
  }
}
```

- [ ] **Step 7: 验证安装**

```bash
npx expo doctor
```

Expected: 无 error（warning 可忽略）。

- [ ] **Step 8: Commit**

```bash
git init
git add package.json app.json
git commit -m "chore: initialize Expo project with dependencies"
```

---

## Task 2: 类型定义

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
// src/types.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared type definitions"
```

---

## Task 3: 主题常量（颜色 + 字体）

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/typography.ts`

- [ ] **Step 1: 创建 colors.ts**

```typescript
// src/theme/colors.ts
export const COLORS = {
  // 主色：深靛蓝（oklch 0.52 0.30 272）
  primary:      '#3B35D4',
  primaryLight: '#EEEEFF',
  primaryDark:  '#1C1870',
  // 副色：霓虹品红（oklch 0.58 0.29 325）
  accent:       '#C026A8',
  accentLight:  '#FCEEFF',
  // 危险/能量：琥珀橙（oklch 0.68 0.22 38）
  danger:       '#D4830A',
  dangerLight:  '#FEF2DC',
  // 成功：翠绿（oklch 0.65 0.20 162）
  success:      '#12A157',
  successLight: '#DCFAED',
  // 警告：暖黄
  warning:      '#D4B800',
  warningLight: '#FFFADE',
  // 界面
  bg:           '#F5F4FF',
  surface:      '#FFFFFF',
  text:         '#0C0B1E',
  textMuted:    '#585278',
  border:       '#E2E2F0',
  // 解锁方式专属色
  mathColor:    '#1A4FDC',
  blinkColor:   '#C026A8',
  shakeColor:   '#D4830A',
} as const;

export type ColorKey = keyof typeof COLORS;
```

- [ ] **Step 2: 创建 typography.ts**

```typescript
// src/theme/typography.ts
export const FONTS = {
  regular:     'Nunito_400Regular',
  semiBold:    'Nunito_600SemiBold',
  bold:        'Nunito_700Bold',
  extraBold:   'Nunito_800ExtraBold',
  black:       'Nunito_900Black',
  // 中文
  cnRegular:   'NotoSansSC_400Regular',
  cnMedium:    'NotoSansSC_500Medium',
  cnBold:      'NotoSansSC_700Bold',
  cnBlack:     'NotoSansSC_900Black',
} as const;

export const FONT_SIZE = {
  xs:   10,
  sm:   12,
  md:   14,
  base: 15,
  lg:   17,
  xl:   22,
  xxl:  28,
  h1:   42,
  hero: 64,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/theme/
git commit -m "feat: add theme colors and typography constants"
```

---

## Task 4: 工具函数（闹钟时间 + 成就）

**Files:**
- Create: `src/utils/alarmTime.ts`
- Create: `src/utils/achievements.ts`
- Create: `__tests__/utils/alarmTime.test.ts`
- Create: `__tests__/utils/achievements.test.ts`

- [ ] **Step 1: 写 alarmTime 测试（先写测试）**

```typescript
// __tests__/utils/alarmTime.test.ts
import { getNextTriggerTimestamp } from '../../src/utils/alarmTime';

describe('getNextTriggerTimestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('one-time alarm in future returns same-day timestamp', () => {
    // Set now to Monday 06:00
    jest.setSystemTime(new Date('2026-04-27T06:00:00'));
    const ts = getNextTriggerTimestamp('07:00', []);
    const d = new Date(ts);
    expect(d.getHours()).toBe(7);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(27);
  });

  it('one-time alarm in past returns next-day timestamp', () => {
    jest.setSystemTime(new Date('2026-04-27T08:00:00'));
    const ts = getNextTriggerTimestamp('07:00', []);
    const d = new Date(ts);
    expect(d.getDate()).toBe(28);
  });

  it('repeating alarm finds next matching weekday', () => {
    // Monday = 1, set now to Tuesday 10:00
    jest.setSystemTime(new Date('2026-04-28T10:00:00')); // Tuesday
    const ts = getNextTriggerTimestamp('07:00', [1]); // Mon only
    const d = new Date(ts);
    expect(d.getDay()).toBe(1); // next Monday
  });

  it('repeating alarm same day future time returns today', () => {
    jest.setSystemTime(new Date('2026-04-27T06:00:00')); // Monday
    const ts = getNextTriggerTimestamp('07:00', [1]); // Mon
    const d = new Date(ts);
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(27);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx jest __tests__/utils/alarmTime.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/utils/alarmTime'`

- [ ] **Step 3: 实现 alarmTime.ts**

```typescript
// src/utils/alarmTime.ts
export function getNextTriggerTimestamp(timeStr: string, repeatDays: number[]): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  if (repeatDays.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate.getTime();
  }

  for (let daysAhead = 0; daysAhead < 8; daysAhead++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + daysAhead);
    candidate.setHours(hours, minutes, 0, 0);
    if (repeatDays.includes(candidate.getDay()) && candidate > now) {
      return candidate.getTime();
    }
  }

  // fallback: 24h from now
  return now.getTime() + 24 * 60 * 60 * 1000;
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
npx jest __tests__/utils/alarmTime.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: 写 achievements 测试**

```typescript
// __tests__/utils/achievements.test.ts
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
```

- [ ] **Step 6: 运行测试，确认失败**

```bash
npx jest __tests__/utils/achievements.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 7: 实现 achievements.ts**

```typescript
// src/utils/achievements.ts
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
```

- [ ] **Step 8: 运行测试，确认通过**

```bash
npx jest __tests__/utils/ --no-coverage
```

Expected: PASS (11 tests)

- [ ] **Step 9: Commit**

```bash
git add src/utils/ __tests__/utils/
git commit -m "feat: add alarmTime and achievements utilities with tests"
```

---

## Task 5: Zustand Stores

**Files:**
- Create: `src/store/alarmStore.ts`
- Create: `src/store/statsStore.ts`
- Create: `__tests__/store/alarmStore.test.ts`
- Create: `__tests__/store/statsStore.test.ts`

- [ ] **Step 1: 写 alarmStore 测试**

```typescript
// __tests__/store/alarmStore.test.ts
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@notifee/react-native', () => ({
  createTriggerNotification: jest.fn().mockResolvedValue('mock-notifee-id'),
  cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
  requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  AndroidImportance: { HIGH: 4 },
  TriggerType: { TIMESTAMP: 0 },
  AndroidVisibility: { PUBLIC: 1 },
  AndroidCategory: { ALARM: 'alarm' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useAlarmStore } from '../../src/store/alarmStore';

describe('alarmStore', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [] });
  });

  it('starts with empty alarms', () => {
    const { result } = renderHook(() => useAlarmStore());
    expect(result.current.alarms).toHaveLength(0);
  });

  it('addAlarm adds an alarm', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: '上班打卡', method: 'math',
        active: true, repeatDays: [1, 2, 3, 4, 5],
      });
    });
    expect(result.current.alarms).toHaveLength(1);
    expect(result.current.alarms[0].label).toBe('上班打卡');
    expect(result.current.alarms[0].id).toBeTruthy();
  });

  it('deleteAlarm removes alarm by id', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: 'test', method: 'shake',
        active: false, repeatDays: [],
      });
    });
    const id = result.current.alarms[0].id;
    await act(async () => {
      await result.current.deleteAlarm(id);
    });
    expect(result.current.alarms).toHaveLength(0);
  });

  it('toggleAlarm flips active state', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: 'test', method: 'blink',
        active: true, repeatDays: [],
      });
    });
    const id = result.current.alarms[0].id;
    await act(async () => {
      await result.current.toggleAlarm(id, false);
    });
    expect(result.current.alarms[0].active).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx jest __tests__/store/alarmStore.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: 实现 notifeeService.ts**

```typescript
// src/services/notifeeService.ts
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
} from '@notifee/react-native';
import { Alarm } from '../types';
import { getNextTriggerTimestamp } from '../utils/alarmTime';

export async function setupNotifee(): Promise<void> {
  await notifee.requestPermission();
  await notifee.createChannel({
    id: 'alarm',
    name: '闹钟',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function scheduleAlarm(alarm: Alarm): Promise<string> {
  const timestamp = getNextTriggerTimestamp(alarm.time, alarm.repeatDays);
  return notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: '叫不醒你不罢休 ⏰',
      body: alarm.label,
      android: {
        channelId: 'alarm',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.ALARM,
        fullScreenAction: { id: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        sound: 'default',
        vibrationPattern: [300, 500],
        asForegroundService: true,
      },
    },
    { type: TriggerType.TIMESTAMP, timestamp },
  );
}

export async function cancelAlarm(notifeeJobId: string): Promise<void> {
  await notifee.cancelTriggerNotification(notifeeJobId);
}
```

- [ ] **Step 4: 实现 alarmStore.ts**

```typescript
// src/store/alarmStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, DismissMethod } from '../types';
import { scheduleAlarm, cancelAlarm } from '../services/notifeeService';

interface AlarmStore {
  alarms: Alarm[];
  addAlarm: (data: Omit<Alarm, 'id' | 'notifeeJobId'>) => Promise<void>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string, active: boolean) => Promise<void>;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set, get) => ({
      alarms: [],

      addAlarm: async (data) => {
        const alarm: Alarm = { ...data, id: Date.now().toString() };
        if (alarm.active) {
          alarm.notifeeJobId = await scheduleAlarm(alarm);
        }
        set(s => ({ alarms: [...s.alarms, alarm] }));
      },

      updateAlarm: async (alarm) => {
        const old = get().alarms.find(a => a.id === alarm.id);
        if (old?.notifeeJobId) await cancelAlarm(old.notifeeJobId);
        if (alarm.active) {
          alarm.notifeeJobId = await scheduleAlarm(alarm);
        }
        set(s => ({ alarms: s.alarms.map(a => a.id === alarm.id ? alarm : a) }));
      },

      deleteAlarm: async (id) => {
        const alarm = get().alarms.find(a => a.id === id);
        if (alarm?.notifeeJobId) await cancelAlarm(alarm.notifeeJobId);
        set(s => ({ alarms: s.alarms.filter(a => a.id !== id) }));
      },

      toggleAlarm: async (id, active) => {
        const alarm = get().alarms.find(a => a.id === id);
        if (!alarm) return;
        if (alarm.notifeeJobId) await cancelAlarm(alarm.notifeeJobId);
        let notifeeJobId: string | undefined;
        if (active) notifeeJobId = await scheduleAlarm({ ...alarm, active });
        set(s => ({
          alarms: s.alarms.map(a => a.id === id ? { ...a, active, notifeeJobId } : a),
        }));
      },
    }),
    { name: 'alarm-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

- [ ] **Step 5: 实现 statsStore.ts**

```typescript
// src/store/statsStore.ts
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
```

- [ ] **Step 6: 运行测试，确认 alarmStore 通过**

```bash
npx jest __tests__/store/ --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/store/ src/services/ __tests__/store/
git commit -m "feat: add alarm and stats Zustand stores with notifee service"
```

---

## Task 6: 共享 UI 组件

**Files:**
- Create: `src/components/ToggleSwitch.tsx`
- Create: `src/components/DismissBadge.tsx`
- Create: `src/components/BackButton.tsx`
- Create: `src/components/SectionLabel.tsx`
- Create: `src/components/AlarmCard.tsx`
- Create: `__tests__/components/ToggleSwitch.test.tsx`
- Create: `__tests__/components/DismissBadge.test.tsx`

- [ ] **Step 1: 写 ToggleSwitch 测试**

```typescript
// __tests__/components/ToggleSwitch.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ToggleSwitch from '../../src/components/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders without crash', () => {
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={jest.fn()} />
    );
    expect(getByTestId('toggle-switch')).toBeTruthy();
  });

  it('calls onChange when pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={onChange} />
    );
    fireEvent.press(getByTestId('toggle-switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('passes true when currently false', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={onChange} />
    );
    fireEvent.press(getByTestId('toggle-switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: 实现 ToggleSwitch.tsx**

```typescript
// src/components/ToggleSwitch.tsx
import React from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props { value: boolean; onChange: (v: boolean) => void; }

export default function ToggleSwitch({ value, onChange }: Props) {
  const translateX = React.useRef(new Animated.Value(value ? 20 : 2)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 20 : 2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Pressable
      testID="toggle-switch"
      onPress={() => onChange(!value)}
      style={[styles.track, { backgroundColor: value ? COLORS.primary : '#d0cce8' }]}
    >
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track:  { width: 44, height: 26, borderRadius: 13, position: 'relative' },
  knob:   { position: 'absolute', top: 2, width: 22, height: 22, borderRadius: 11,
             backgroundColor: 'white', elevation: 2,
             shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
});
```

- [ ] **Step 3: 实现 DismissBadge.tsx**

```typescript
// src/components/DismissBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DismissMethod, DISMISS_METHODS } from '../types';

interface Props { method: DismissMethod; small?: boolean; }

export default function DismissBadge({ method, small = false }: Props) {
  const m = DISMISS_METHODS[method];
  return (
    <View style={[styles.badge, { backgroundColor: m.color + '22' }]}>
      <Text style={[styles.text, { color: m.color, fontSize: small ? 10 : 12 }]}>
        {m.emoji} {m.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text:  { fontWeight: '700' },
});
```

- [ ] **Step 4: 实现 BackButton.tsx**

```typescript
// src/components/BackButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props { onPress: () => void; label?: string; }

export default function BackButton({ onPress, label = '返回' }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.arrow}>‹</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  arrow: { fontSize: 22, color: COLORS.primary, fontWeight: '700', lineHeight: 24 },
  label: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});
```

- [ ] **Step 5: 实现 SectionLabel.tsx**

```typescript
// src/components/SectionLabel.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase',
  },
});
```

- [ ] **Step 6: 实现 AlarmCard.tsx**

```typescript
// src/components/AlarmCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Alarm, DISMISS_METHODS } from '../types';
import { COLORS } from '../theme/colors';
import ToggleSwitch from './ToggleSwitch';
import DismissBadge from './DismissBadge';

interface Props {
  alarm: Alarm;
  onPress: () => void;
  onToggle: (active: boolean) => void;
}

export default function AlarmCard({ alarm, onPress, onToggle }: Props) {
  const m = DISMISS_METHODS[alarm.method];
  return (
    <Pressable onPress={onPress} style={[styles.card, {
      borderLeftColor: alarm.active ? m.color : '#e0daf5',
      opacity: alarm.active ? 1 : 0.65,
      shadowColor: m.color,
      shadowOpacity: alarm.active ? 0.15 : 0,
    }]}>
      <View style={styles.info}>
        <Text style={[styles.time, { color: alarm.active ? COLORS.text : COLORS.textMuted }]}>
          {alarm.time}
        </Text>
        <Text style={styles.label}>{alarm.label}</Text>
        <DismissBadge method={alarm.method} small />
      </View>
      <Pressable onPress={e => { e.stopPropagation?.(); onToggle(!alarm.active); }}>
        <ToggleSwitch value={alarm.active} onChange={onToggle} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, elevation: 2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  info:  { flex: 1 },
  time:  { fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  label: { fontSize: 13, color: '#585278', marginTop: 3, fontWeight: '600' },
});
```

- [ ] **Step 7: 运行组件测试**

```bash
npx jest __tests__/components/ --no-coverage
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/ __tests__/components/
git commit -m "feat: add shared UI components"
```

---

## Task 7: 导航 + App 根组件

**Files:**
- Create: `src/navigation/AppNavigator.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: 实现 AppNavigator.tsx**

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';
import RingingScreen from '../screens/RingingScreen';
import MathUnlockScreen from '../screens/MathUnlockScreen';
import BlinkUnlockScreen from '../screens/BlinkUnlockScreen';
import ShakeUnlockScreen from '../screens/ShakeUnlockScreen';
import SuccessScreen from '../screens/SuccessScreen';
import { Alarm } from '../types';

export type RootStackParamList = {
  Tabs: undefined;
  EditAlarm: { alarm?: Alarm };
  Ringing: { alarm: Alarm };
  MathUnlock: { alarm: Alarm };
  BlinkUnlock: { alarm: Alarm };
  ShakeUnlock: { alarm: Alarm };
  Success: { alarm: Alarm };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { borderTopColor: '#ede8ff', paddingBottom: 4 },
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 10, color, fontWeight: '700' }}>
            {route.name === 'Home' ? '闹钟' : '统计'}
          </Text>
        ),
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 22 }}>{route.name === 'Home' ? '⏰' : '📊'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="Ringing" component={RingingScreen}
          options={{ gestureEnabled: false }} />
        <Stack.Screen name="MathUnlock" component={MathUnlockScreen} />
        <Stack.Screen name="BlinkUnlock" component={BlinkUnlockScreen} />
        <Stack.Screen name="ShakeUnlock" component={ShakeUnlockScreen} />
        <Stack.Screen name="Success" component={SuccessScreen}
          options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: 更新 App.tsx**

```typescript
// App.tsx
import React from 'react';
import { useFonts,
  Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold,
  Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { NotoSansSC_400Regular, NotoSansSC_700Bold } from '@expo-google-fonts/noto-sans-sc';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotifee } from './src/services/notifeeService';

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold,
    Nunito_800ExtraBold, Nunito_900Black,
    NotoSansSC_400Regular, NotoSansSC_700Bold,
  });

  React.useEffect(() => {
    setupNotifee();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}
```

- [ ] **Step 3: 安装字体包**

```bash
npx expo install @expo-google-fonts/nunito @expo-google-fonts/noto-sans-sc
```

- [ ] **Step 4: Commit**

```bash
git add src/navigation/ App.tsx
git commit -m "feat: add navigation structure and font loading"
```

---

## Task 8: HomeScreen

**Files:**
- Create: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: 实现 HomeScreen.tsx**

```typescript
// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAlarmStore } from '../store/alarmStore';
import { COLORS } from '../theme/colors';
import AlarmCard from '../components/AlarmCard';
import SectionLabel from '../components/SectionLabel';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Alarm } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

const MOTIVATIONS = [
  '今天也要元气满满！💪', '打工人，冲！',
  '床是你的敌人！🛏️', '离发薪日又近一天！',
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { alarms, toggleAlarm } = useAlarmStore();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const days = ['日','一','二','三','四','五','六'];
  const dateStr = `${now.getMonth()+1}月${now.getDate()}日 周${days[now.getDay()]}`;
  const activeCount = alarms.filter(a => a.active).length;
  const motto = MOTIVATIONS[now.getDay() % MOTIVATIONS.length];

  const handleRing = (alarm: Alarm) => navigation.navigate('Ringing', { alarm });
  const handleEdit = (alarm?: Alarm) => navigation.navigate('EditAlarm', { alarm });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#16143A', '#2A1F5E', '#4A2070']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>叫不醒你不罢休 ⏰</Text>
            <Text style={styles.clock}>{timeStr}</Text>
            <Text style={styles.date}>{dateStr} · {activeCount} 个闹钟已开启</Text>
          </View>
        </View>
        <View style={styles.motto}>
          <Text style={styles.mottoText}>😈 {motto}</Text>
        </View>
      </LinearGradient>

      {/* List */}
      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10, paddingBottom: 100 }}>
        <SectionLabel>我的闹钟</SectionLabel>
        {alarms.map(alarm => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onPress={() => handleRing(alarm)}
            onToggle={(active) => toggleAlarm(alarm.id, active)}
          />
        ))}
        {alarms.length === 0 && (
          <Text style={styles.empty}>还没有闹钟，点击 + 新建一个 👇</Text>
        )}
        <Text style={styles.hint}>点击任意闹钟可模拟响铃体验 👆</Text>
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => handleEdit()}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  header:      { padding: 20, paddingTop: 16, paddingBottom: 20 },
  headerTop:   { flexDirection: 'row', justifyContent: 'space-between' },
  appName:     { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5 },
  clock:       { fontSize: 52, fontWeight: '900', color: 'white', letterSpacing: -2, lineHeight: 56, marginTop: 2 },
  date:        { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '600' },
  motto:       { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10,
                  paddingHorizontal: 12, paddingVertical: 8 },
  mottoText:   { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  list:        { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  hint:        { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, fontWeight: '600', paddingVertical: 8 },
  empty:       { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginTop: 40 },
  fab:         { position: 'absolute', bottom: 90, right: 20 },
  fabGradient: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
                  elevation: 6, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 } },
  fabText:     { fontSize: 28, color: 'white', lineHeight: 32, marginTop: -2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: implement HomeScreen with alarm list"
```

---

## Task 9: EditAlarmScreen

**Files:**
- Create: `src/screens/EditAlarmScreen.tsx`

- [ ] **Step 1: 实现 EditAlarmScreen.tsx**

```typescript
// src/screens/EditAlarmScreen.tsx
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAlarmStore } from '../store/alarmStore';
import { COLORS } from '../theme/colors';
import { DismissMethod, DISMISS_METHODS } from '../types';
import BackButton from '../components/BackButton';
import SectionLabel from '../components/SectionLabel';
import { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'EditAlarm'>;
type Nav = StackNavigationProp<RootStackParamList>;

const DAY_LABELS = ['日','一','二','三','四','五','六'];

export default function EditAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.alarm;

  const { addAlarm, updateAlarm } = useAlarmStore();

  const [hour, setHour] = React.useState(existing ? parseInt(existing.time.split(':')[0]) : 7);
  const [minute, setMinute] = React.useState(existing ? parseInt(existing.time.split(':')[1]) : 0);
  const [label, setLabel] = React.useState(existing?.label ?? '');
  const [method, setMethod] = React.useState<DismissMethod>(existing?.method ?? 'math');
  const [repeatDays, setRepeatDays] = React.useState<number[]>(existing?.repeatDays ?? [1,2,3,4,5]);

  const timeStr = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;

  const toggleDay = (d: number) =>
    setRepeatDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleSave = async () => {
    const data = { time: timeStr, label: label || '新闹钟', method, active: true, repeatDays };
    if (existing) {
      await updateAlarm({ ...existing, ...data });
    } else {
      await addAlarm(data);
    }
    navigation.goBack();
  };

  const stepBtn = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={styles.stepBtn}>
      <Text style={styles.stepBtnText}>{label}</Text>
    </Pressable>
  );

  const methods: DismissMethod[] = ['math', 'blink', 'shake'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{existing ? '编辑闹钟' : '新建闹钟'}</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>保存</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        {/* Time picker */}
        <View style={styles.card}>
          <Text style={styles.timeBig}>{timeStr}</Text>
          <View style={styles.stepRow}>
            {(['时', '分'] as const).map((unit, i) => {
              const val = i === 0 ? hour : minute;
              const setter = i === 0 ? setHour : setMinute;
              const max = i === 0 ? 24 : 60;
              const step = i === 0 ? 1 : 5;
              return (
                <View key={unit} style={styles.stepGroup}>
                  {stepBtn('▲', () => setter(v => (v + step) % max))}
                  <Text style={styles.stepUnit}>{unit}</Text>
                  {stepBtn('▼', () => setter(v => (v - step + max) % max))}
                </View>
              );
            })}
          </View>
        </View>

        {/* Repeat days */}
        <View style={styles.card}>
          <SectionLabel>重复</SectionLabel>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((d, i) => (
              <Pressable key={i} onPress={() => toggleDay(i)}
                style={[styles.dayBtn, repeatDays.includes(i) && styles.dayBtnActive]}>
                <Text style={[styles.dayText, repeatDays.includes(i) && styles.dayTextActive]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Label */}
        <View style={styles.card}>
          <SectionLabel>闹钟名称</SectionLabel>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="给这次折磨取个响亮的名字…"
            placeholderTextColor={COLORS.border}
            style={styles.input}
          />
        </View>

        {/* Method */}
        <View style={styles.card}>
          <SectionLabel>😈 选择折磨方式</SectionLabel>
          <View style={{ gap: 8 }}>
            {methods.map(m => {
              const info = DISMISS_METHODS[m];
              const selected = method === m;
              return (
                <Pressable key={m} onPress={() => setMethod(m)}
                  style={[styles.methodCard, {
                    borderColor: selected ? info.color : COLORS.border,
                    backgroundColor: selected ? info.color + '12' : 'transparent',
                  }]}>
                  <Text style={{ fontSize: 26 }}>{info.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodTitle, { color: selected ? info.color : COLORS.text }]}>
                      {info.label}
                    </Text>
                    <Text style={styles.methodDesc}>{info.desc}</Text>
                  </View>
                  <View style={[styles.radio, {
                    borderColor: selected ? info.color : '#d0cce8',
                    backgroundColor: selected ? info.color : 'transparent',
                  }]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  navBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white',
                   borderBottomWidth: 1, borderBottomColor: '#ede8ff' },
  title:        { fontSize: 16, fontWeight: '800', color: COLORS.text },
  saveBtn:      { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  saveBtnText:  { color: 'white', fontWeight: '800', fontSize: 14 },
  scroll:       { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card:         { backgroundColor: 'white', borderRadius: 20, padding: 18, elevation: 1,
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  timeBig:      { fontSize: 64, fontWeight: '900', color: COLORS.text, textAlign: 'center', letterSpacing: -3 },
  stepRow:      { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 14 },
  stepGroup:    { alignItems: 'center', gap: 8 },
  stepBtn:      { backgroundColor: COLORS.primaryLight, borderRadius: 10, width: 48, height: 32,
                   alignItems: 'center', justifyContent: 'center' },
  stepBtnText:  { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  stepUnit:     { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  daysRow:      { flexDirection: 'row', gap: 6 },
  dayBtn:       { flex: 1, height: 34, borderRadius: 8, backgroundColor: COLORS.bg,
                   alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: COLORS.primary },
  dayText:      { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  dayTextActive:{ color: 'white' },
  input:        { backgroundColor: COLORS.bg, borderRadius: 10, paddingHorizontal: 12,
                   paddingVertical: 10, fontSize: 15, fontWeight: '600', color: COLORS.text },
  methodCard:   { borderWidth: 2, borderRadius: 14, padding: 12, flexDirection: 'row',
                   alignItems: 'center', gap: 12 },
  methodTitle:  { fontWeight: '800', fontSize: 14 },
  methodDesc:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                   alignItems: 'center', justifyContent: 'center' },
  radioDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/EditAlarmScreen.tsx
git commit -m "feat: implement EditAlarmScreen with time picker and method selector"
```

---

## Task 10: RingingScreen

**Files:**
- Create: `src/screens/RingingScreen.tsx`

- [ ] **Step 1: 实现 RingingScreen.tsx**

```typescript
// src/screens/RingingScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DISMISS_METHODS } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';

type Route = RouteProp<RootStackParamList, 'Ringing'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function RingingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarm } = route.params;
  const { recordFailure } = useStatsStore();
  const m = DISMISS_METHODS[alarm.method];

  const [now, setNow] = React.useState(new Date());
  const bellAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnims = [0, 1, 2].map(() => React.useRef(new Animated.Value(0)).current);

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    // Bell shake animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1, duration: 225, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -1, duration: 225, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 225, useNativeDriver: true }),
      ])
    ).start();

    // Pulse rings
    pulseAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      anim.setValue(0);
    });
  }, []);

  const bellRotate = bellAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const screenMap: Record<string, keyof RootStackParamList> = {
    math: 'MathUnlock', blink: 'BlinkUnlock', shake: 'ShakeUnlock',
  };

  const handleDismiss = () => navigation.navigate(screenMap[alarm.method] as any, { alarm });
  const handleSnooze = () => {
    recordFailure();
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#120E2A', '#0A0818', '#080512']}
      style={styles.container}
    >
      {/* Pulse rings */}
      {pulseAnims.map((anim, i) => (
        <Animated.View key={i} style={[styles.pulse, {
          width: 200 + i * 80, height: 200 + i * 80,
          borderRadius: (200 + i * 80) / 2,
          backgroundColor: m.color + (i === 0 ? '30' : i === 1 ? '18' : '0c'),
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] }) }],
        }]} />
      ))}

      {/* Label */}
      <View style={styles.topLabel}>
        <Text style={styles.alarmLabel}>{alarm.label}</Text>
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Animated.Text style={[styles.bell, { transform: [{ rotate: bellRotate }] }]}>🔔</Animated.Text>
        <Text style={styles.clockText}>{timeStr}</Text>
        <Text style={styles.wakeUp}>起床啦！打工人！ 💼</Text>
        <Text style={styles.sub}>你的老板已经到了（大概）</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable style={[styles.dismissBtn, { backgroundColor: m.color }]} onPress={handleDismiss}>
          <Text style={styles.dismissText}>{m.emoji} 关闭闹钟（{m.label}）</Text>
        </Pressable>
        <Pressable style={styles.snoozeBtn} onPress={handleSnooze}>
          <Text style={styles.snoozeText}>再睡5分钟（此功能已被你亲手禁用 😈）</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 48, paddingHorizontal: 24 },
  pulse:       { position: 'absolute', top: '50%', left: '50%', marginLeft: -100, marginTop: -100 },
  topLabel:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
                  paddingHorizontal: 14, paddingVertical: 6, zIndex: 1 },
  alarmLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  center:      { alignItems: 'center', zIndex: 1 },
  bell:        { fontSize: 76, lineHeight: 80 },
  clockText:   { fontSize: 70, fontWeight: '900', color: 'white', letterSpacing: -4, marginTop: 10 },
  wakeUp:      { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 10, fontWeight: '600' },
  sub:         { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  buttons:     { width: '100%', gap: 10, zIndex: 1 },
  dismissBtn:  { width: '100%', padding: 16, borderRadius: 18, alignItems: 'center' },
  dismissText: { color: 'white', fontWeight: '900', fontSize: 17 },
  snoozeBtn:   { width: '100%', padding: 13, borderRadius: 18, alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)' },
  snoozeText:  { color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 13 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/RingingScreen.tsx
git commit -m "feat: implement RingingScreen with animated bell and pulse rings"
```

---

## Task 11: MathUnlockScreen

**Files:**
- Create: `src/screens/MathUnlockScreen.tsx`
- Create: `__tests__/screens/MathUnlockScreen.test.tsx`

- [ ] **Step 1: 写 MathUnlock 测试**

```typescript
// __tests__/screens/MathUnlockScreen.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { alarm: { id: '1', time: '07:00', label: 'test', method: 'math', active: true, repeatDays: [] } } }),
}));
jest.mock('../../src/store/statsStore', () => ({
  useStatsStore: () => ({ recordSuccess: jest.fn(), resetConsecutiveMath: jest.fn() }),
}));

import MathUnlockScreen from '../../src/screens/MathUnlockScreen';

describe('MathUnlockScreen', () => {
  it('renders numpad buttons', () => {
    const { getByText } = render(<MathUnlockScreen />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('⌫')).toBeTruthy();
  });

  it('renders confirm button', () => {
    const { getByText } = render(<MathUnlockScreen />);
    expect(getByText('确认答案 ✓')).toBeTruthy();
  });

  it('pressing numpad updates display', () => {
    const { getByText, getByTestId } = render(<MathUnlockScreen />);
    fireEvent.press(getByText('5'));
    expect(getByTestId('answer-display').props.children).toContain('5');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx jest __tests__/screens/MathUnlockScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: 实现 MathUnlockScreen.tsx**

```typescript
// src/screens/MathUnlockScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';

type Route = RouteProp<RootStackParamList, 'MathUnlock'>;
type Nav = StackNavigationProp<RootStackParamList>;

interface Problem { expr: string; ans: number; }

function genProblem(): Problem {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * 3)];
  let a: number, b: number, ans: number;
  if (op === '+') { a = Math.floor(Math.random()*60)+10; b = Math.floor(Math.random()*60)+10; ans = a+b; }
  else if (op === '-') { a = Math.floor(Math.random()*60)+30; b = Math.floor(Math.random()*30)+5; ans = a-b; }
  else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; ans = a*b; }
  return { expr: `${a} ${op} ${b}`, ans };
}

const WRONG_MSGS = ['不对！你真的醒了吗？🤔', '又答错了！小学白念了吧', '这道题比你的工资还简单！', '再算一遍！脑子呢？'];
const NUMPAD = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

export default function MathUnlockScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarm } = route.params;
  const { recordSuccess } = useStatsStore();

  const [problems] = React.useState<Problem[]>(() => [genProblem(), genProblem(), genProblem()]);
  const [current, setCurrent] = React.useState(0);
  const [input, setInput] = React.useState('');
  const [status, setStatus] = React.useState<'' | 'wrong' | 'right'>('');
  const [wrongCount, setWrongCount] = React.useState(0);
  const [correctStreak, setCorrectStreak] = React.useState(0);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const handleNum = (n: string) => {
    if (status) return;
    setInput(p => p.length < 6 ? p + n : p);
  };
  const handleDel = () => setInput(p => p.slice(0, -1));

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    if (!input || status) return;
    if (parseInt(input) === problems[current].ans) {
      setStatus('right');
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setTimeout(() => {
        setStatus(''); setInput('');
        if (current >= 2) {
          recordSuccess('math', newStreak);
          navigation.navigate('Success', { alarm });
        } else {
          setCurrent(c => c + 1);
        }
      }, 700);
    } else {
      setStatus('wrong');
      setWrongCount(c => c + 1);
      setCorrectStreak(0);
      triggerShake();
      setTimeout(() => { setStatus(''); setInput(''); }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>🧮 答题解锁</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.body}>
        {/* Progress dots */}
        <View style={styles.progress}>
          {[0,1,2].map(i => (
            <View key={i} style={[styles.dot, {
              width: i === current ? 28 : 20,
              backgroundColor: i < current ? COLORS.success : i === current ? COLORS.accent : COLORS.border,
            }]} />
          ))}
          <Text style={styles.progressText}>{current+1}/3</Text>
        </View>

        {/* Problem card */}
        <Animated.View style={[styles.problemCard, {
          borderColor: status === 'wrong' ? COLORS.danger + '44'
                      : status === 'right' ? COLORS.success + '44'
                      : COLORS.accent + '44',
          transform: [{ translateX: shakeAnim }],
        }]}>
          <Text style={styles.problemHint}>计算下面的题目 ✏️</Text>
          <Text style={styles.problemExpr}>{problems[current].expr} = ?</Text>
          <Text testID="answer-display" style={[styles.answerDisplay, {
            color: status === 'wrong' ? COLORS.danger : status === 'right' ? COLORS.success : COLORS.text,
          }]}>
            {status === 'right' ? '✓' : input || '_'}
          </Text>
          {status === 'wrong' && (
            <Text style={styles.wrongMsg}>{WRONG_MSGS[wrongCount % WRONG_MSGS.length]}</Text>
          )}
        </Animated.View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {NUMPAD.map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((key, ki) => (
                <Pressable key={ki}
                  onPress={() => key === '⌫' ? handleDel() : key ? handleNum(key) : null}
                  style={[styles.numKey, {
                    backgroundColor: key === '⌫' ? COLORS.dangerLight : key ? 'white' : 'transparent',
                  }]}>
                  <Text style={[styles.numKeyText, { color: key === '⌫' ? COLORS.danger : COLORS.text }]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!input || !!status}
          style={[styles.confirmBtn, { backgroundColor: input && !status ? COLORS.accent : COLORS.border }]}
        >
          <Text style={[styles.confirmText, { color: input && !status ? 'white' : COLORS.textMuted }]}>
            确认答案 ✓
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  navBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white',
                   borderBottomWidth: 1, borderBottomColor: '#ede8ff' },
  title:        { fontSize: 15, fontWeight: '800', color: COLORS.text },
  body:         { flex: 1, padding: 18, gap: 12 },
  progress:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot:          { height: 7, borderRadius: 4 },
  progressText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginLeft: 4 },
  problemCard:  { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 2,
                   alignItems: 'center', elevation: 2 },
  problemHint:  { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
  problemExpr:  { fontSize: 36, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  answerDisplay:{ fontSize: 44, fontWeight: '900', letterSpacing: -2, marginTop: 12, minHeight: 56 },
  wrongMsg:     { fontSize: 12, color: COLORS.danger, marginTop: 4, fontWeight: '700' },
  numpad:       { gap: 7 },
  numpadRow:    { flexDirection: 'row', gap: 7 },
  numKey:       { flex: 1, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                   elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  numKeyText:   { fontSize: 22, fontWeight: '700' },
  confirmBtn:   { padding: 14, borderRadius: 16, alignItems: 'center' },
  confirmText:  { fontWeight: '800', fontSize: 16 },
});
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
npx jest __tests__/screens/MathUnlockScreen.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/MathUnlockScreen.tsx __tests__/screens/MathUnlockScreen.test.tsx
git commit -m "feat: implement MathUnlockScreen with numpad and shake-on-wrong"
```

---

## Task 12: useShake Hook + ShakeUnlockScreen

**Files:**
- Create: `src/hooks/useShake.ts`
- Create: `src/screens/ShakeUnlockScreen.tsx`
- Create: `__tests__/screens/ShakeUnlockScreen.test.tsx`

- [ ] **Step 1: 实现 useShake.ts**

```typescript
// src/hooks/useShake.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';

const THRESHOLD = 1.8;   // g
const COOLDOWN_MS = 100; // 最小间隔避免重复计数

export function useShake(onShake: () => void) {
  const lastShakeTime = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const total = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (total > THRESHOLD && now - lastShakeTime.current > COOLDOWN_MS) {
        lastShakeTime.current = now;
        onShake();
      }
    });
    return () => sub.remove();
  }, [onShake]);
}
```

- [ ] **Step 2: 写 ShakeUnlock 测试**

```typescript
// __tests__/screens/ShakeUnlockScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { alarm: { id: '1', time: '07:00', label: 'test', method: 'shake', active: true, repeatDays: [] } } }),
}));
jest.mock('expo-sensors', () => ({
  Accelerometer: { setUpdateInterval: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('../../src/store/statsStore', () => ({
  useStatsStore: () => ({ recordSuccess: jest.fn() }),
}));

import ShakeUnlockScreen from '../../src/screens/ShakeUnlockScreen';

describe('ShakeUnlockScreen', () => {
  it('renders progress ring and shake button', () => {
    const { getByText } = render(<ShakeUnlockScreen />);
    expect(getByText('摇摇摇！')).toBeTruthy();
  });

  it('shows count 0 initially', () => {
    const { getByTestId } = render(<ShakeUnlockScreen />);
    expect(getByTestId('shake-count').props.children).toBe(0);
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

```bash
npx jest __tests__/screens/ShakeUnlockScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 4: 实现 ShakeUnlockScreen.tsx**

```typescript
// src/screens/ShakeUnlockScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import { useShake } from '../hooks/useShake';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';

type Route = RouteProp<RootStackParamList, 'ShakeUnlock'>;
type Nav = StackNavigationProp<RootStackParamList>;

const TARGET = 30;
const MSGS = ['长按下方按钮开始摇！', '继续！别停！', '快到了！坚持住！', '就差一点！！', '🎉 摇醒了！'];

export default function ShakeUnlockScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarm } = route.params;
  const { recordSuccess } = useStatsStore();

  const [count, setCount] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const handleShake = React.useCallback(() => {
    if (done) return;
    setCount(c => {
      const nc = c + 1;
      if (nc >= TARGET) {
        setDone(true);
        recordSuccess('shake');
        setTimeout(() => navigation.navigate('Success', { alarm }), 800);
      }
      return nc;
    });
  }, [done]);

  useShake(handleShake);

  React.useEffect(() => {
    if (count > 0 && !done) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

  const progress = Math.min(count / TARGET, 1);
  const r = 52, circ = 2 * Math.PI * r;
  const msgIdx = count === 0 ? 0 : count < 10 ? 1 : count < 20 ? 2 : count < TARGET ? 3 : 4;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>📳 摇晃解锁</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.body}>
        {/* Progress ring */}
        <View style={styles.ringWrap}>
          <Svg width={130} height={130} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={65} cy={65} r={r} fill="none" stroke={COLORS.border} strokeWidth={10} />
            <Circle cx={65} cy={65} r={r} fill="none"
              stroke={done ? COLORS.success : COLORS.danger}
              strokeWidth={10} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} />
          </Svg>
          <View style={styles.ringCenter}>
            <Text testID="shake-count" style={styles.countText}>{count}</Text>
            <Text style={styles.targetText}>/ {TARGET}</Text>
          </View>
        </View>

        {/* Phone emoji */}
        <Animated.Text style={[styles.phone, { transform: [{ translateX: shakeAnim }] }]}>
          📱
        </Animated.Text>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.msg, { color: done ? COLORS.success : COLORS.text }]}>{MSGS[msgIdx]}</Text>
          <Text style={styles.hint}>{done ? '清醒了！太棒了打工人！' : '用力摇晃手机！'}</Text>
        </View>

        {!done && (
          <View style={styles.simulateWrap}>
            <Text style={styles.simulateHint}>（调试：点击模拟一次摇晃）</Text>
            <Pressable onPress={handleShake} style={[styles.shakeBtn, { backgroundColor: COLORS.danger }]}>
              <Text style={styles.shakeBtnText}>摇摇摇！</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  navBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white',
                   borderBottomWidth: 1, borderBottomColor: '#ede8ff' },
  title:        { fontSize: 15, fontWeight: '800', color: COLORS.text },
  body:         { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 24 },
  ringWrap:     { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  ringCenter:   { position: 'absolute', alignItems: 'center' },
  countText:    { fontSize: 30, fontWeight: '900', color: COLORS.text },
  targetText:   { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  phone:        { fontSize: 70 },
  msg:          { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  hint:         { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  simulateWrap: { alignItems: 'center', gap: 8 },
  simulateHint: { fontSize: 11, color: COLORS.textMuted },
  shakeBtn:     { width: 150, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                   elevation: 6 },
  shakeBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },
});
```

- [ ] **Step 5: 运行测试，确认通过**

```bash
npx jest __tests__/screens/ShakeUnlockScreen.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useShake.ts src/screens/ShakeUnlockScreen.tsx __tests__/screens/
git commit -m "feat: implement useShake hook and ShakeUnlockScreen"
```

---

## Task 13: useBlink Hook + BlinkUnlockScreen

**Files:**
- Create: `src/hooks/useBlink.ts`
- Create: `src/screens/BlinkUnlockScreen.tsx`
- Create: `__tests__/screens/BlinkUnlockScreen.test.tsx`

- [ ] **Step 1: 实现 useBlink.ts**

```typescript
// src/hooks/useBlink.ts
import { useRef, useCallback } from 'react';
import { FaceDetectionResult } from 'expo-face-detector';

const BLINK_THRESHOLD = 0.3;   // 眼睛开合概率低于此值判定为闭眼
const OPEN_THRESHOLD  = 0.7;   // 高于此值判定为睁眼
const DEBOUNCE_MS     = 400;   // 两次眨眼最小间隔

export function useBlink(onBlink: () => void) {
  const wasClosed = useRef(false);
  const lastBlinkTime = useRef(0);

  const handleFaces = useCallback((result: FaceDetectionResult) => {
    if (result.faces.length === 0) return;
    const face = result.faces[0] as any;
    const leftOpen  = face.leftEyeOpenProbability  ?? 1;
    const rightOpen = face.rightEyeOpenProbability ?? 1;
    const bothClosed = leftOpen < BLINK_THRESHOLD && rightOpen < BLINK_THRESHOLD;
    const bothOpen   = leftOpen > OPEN_THRESHOLD  && rightOpen > OPEN_THRESHOLD;
    const now = Date.now();

    if (bothClosed && !wasClosed.current) {
      wasClosed.current = true;
    } else if (bothOpen && wasClosed.current) {
      wasClosed.current = false;
      if (now - lastBlinkTime.current > DEBOUNCE_MS) {
        lastBlinkTime.current = now;
        onBlink();
      }
    }
  }, [onBlink]);

  return { handleFaces };
}
```

- [ ] **Step 2: 写 BlinkUnlock 测试**

```typescript
// __tests__/screens/BlinkUnlockScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { alarm: { id: '1', time: '07:00', label: 'test', method: 'blink', active: true, repeatDays: [] } } }),
}));
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock('expo-face-detector', () => ({
  FaceDetectorClassifications: { all: 1 },
  FaceDetectorMode: { fast: 1 },
}));
jest.mock('../../src/store/statsStore', () => ({
  useStatsStore: () => ({ recordSuccess: jest.fn() }),
}));

import BlinkUnlockScreen from '../../src/screens/BlinkUnlockScreen';

describe('BlinkUnlockScreen', () => {
  it('renders blink counter circles', () => {
    const { getByText } = render(<BlinkUnlockScreen />);
    expect(getByText('👁️ 眨眼解锁')).toBeTruthy();
  });

  it('shows blink count 0/3 initially', () => {
    const { getByTestId } = render(<BlinkUnlockScreen />);
    expect(getByTestId('blink-progress').props.children).toContain('0');
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

```bash
npx jest __tests__/screens/BlinkUnlockScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 4: 实现 BlinkUnlockScreen.tsx**

```typescript
// src/screens/BlinkUnlockScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceDetectorClassifications, FaceDetectorMode } from 'expo-face-detector';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import { useBlink } from '../hooks/useBlink';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';

type Route = RouteProp<RootStackParamList, 'BlinkUnlock'>;
type Nav = StackNavigationProp<RootStackParamList>;

const TARGET = 3;
const HINTS = ['对准摄像头，眨眼3次', '再眨一次！快！', '最后一下！', '通过了！'];

export default function BlinkUnlockScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarm } = route.params;
  const { recordSuccess } = useStatsStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [blinks, setBlinks] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const handleBlink = React.useCallback(() => {
    if (done) return;
    setBlinks(prev => {
      const nb = prev + 1;
      if (nb >= TARGET) {
        setDone(true);
        recordSuccess('blink');
        setTimeout(() => navigation.navigate('Success', { alarm }), 900);
      }
      return nb;
    });
  }, [done]);

  const { handleFaces } = useBlink(handleBlink);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <Text style={{ fontSize: 48 }}>📷</Text>
        <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '600' }}>需要摄像头权限进行眨眼检测</Text>
        <Pressable onPress={requestPermission} style={[styles.btn, { backgroundColor: COLORS.primary }]}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>授权摄像头</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>👁️ 眨眼解锁</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.body}>
        {/* Camera viewfinder */}
        <View style={styles.viewfinder}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            onFacesDetected={handleFaces}
            faceDetectorSettings={{
              mode: FaceDetectorMode.fast,
              detectLandmarks: FaceDetectorClassifications.all,
              runClassifications: FaceDetectorClassifications.all,
              minDetectionInterval: 100,
              tracking: true,
            }}
          />
          {/* Corner brackets */}
          {[
            { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
            { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
            { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
            { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
          ].map((s, i) => (
            <View key={i} style={[styles.bracket, { borderColor: done ? COLORS.success : COLORS.accent }, s]} />
          ))}
          <Text style={styles.scanStatus}>
            {done ? '🎉 全部完成！' : '检测中 · 请正视摄像头并眨眼'}
          </Text>
        </View>

        {/* Blink counter */}
        <View style={styles.blinkCounter}>
          {[0,1,2].map(i => (
            <View key={i} style={[styles.blinkCircle, {
              backgroundColor: i < blinks ? COLORS.primary : COLORS.primaryLight,
            }]}>
              <Text style={{ fontSize: i < blinks ? 20 : 14,
                color: i < blinks ? 'white' : COLORS.textMuted, fontWeight: '800' }}>
                {i < blinks ? '👁️' : i + 1}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.hint}>{HINTS[Math.min(blinks, 3)]}</Text>
          <Text testID="blink-progress" style={styles.subHint}>
            已眨眼 {blinks} / {TARGET} 次
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  navBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white',
                   borderBottomWidth: 1, borderBottomColor: '#ede8ff' },
  title:        { fontSize: 15, fontWeight: '800', color: COLORS.text },
  body:         { flex: 1, alignItems: 'center', padding: 16, gap: 20 },
  viewfinder:   { width: '100%', aspectRatio: 1, maxHeight: 260, borderRadius: 22,
                   overflow: 'hidden', backgroundColor: '#12102a',
                   borderWidth: 2, borderColor: COLORS.primary + '55' },
  bracket:      { position: 'absolute', width: 20, height: 20 },
  scanStatus:   { position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center',
                   fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  blinkCounter: { flexDirection: 'row', gap: 12 },
  blinkCircle:  { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  hint:         { fontSize: 17, fontWeight: '800', color: COLORS.text },
  subHint:      { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  btn:          { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
});
```

- [ ] **Step 5: 运行测试**

```bash
npx jest __tests__/screens/BlinkUnlockScreen.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useBlink.ts src/screens/BlinkUnlockScreen.tsx __tests__/screens/BlinkUnlockScreen.test.tsx
git commit -m "feat: implement useBlink hook and BlinkUnlockScreen with camera"
```

---

## Task 14: SuccessScreen + StatsScreen

**Files:**
- Create: `src/screens/SuccessScreen.tsx`
- Create: `src/screens/StatsScreen.tsx`

- [ ] **Step 1: 实现 SuccessScreen.tsx**

```typescript
// src/screens/SuccessScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'Success'>;
type Nav = StackNavigationProp<RootStackParamList>;

const MSGS = [
  '你终于起来了！可喜可贺！',
  '打工人！冲鸭！今天也要卷！',
  '你的床正在哭泣 😢',
  '今天又是对抗地心引力成功的一天！',
];

export default function SuccessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [msg] = React.useState(() => MSGS[Math.floor(Math.random() * MSGS.length)]);
  const popAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(popAnim, {
      toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient colors={[COLORS.successLight, COLORS.bg]} style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <Animated.Text style={[styles.emoji, {
          transform: [{ scale: popAnim }],
          opacity: popAnim,
        }]}>🎉</Animated.Text>

        <Text style={styles.title}>闹钟已关闭！</Text>
        <Text style={styles.msg}>{msg}</Text>

        <View style={styles.pointsCard}>
          <Text style={styles.points}>+ 10 积分</Text>
          <Text style={styles.pointsSub}>成功解锁 · 连续打卡进度 +1 🔥</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('Tabs', undefined)}
          style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>开始新的一天 ☀️</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  emoji:     { fontSize: 78 },
  title:     { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  msg:       { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 260 },
  pointsCard:{ backgroundColor: 'white', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24,
                alignItems: 'center', width: '100%', borderWidth: 1, borderColor: COLORS.success + '33',
                elevation: 2 },
  points:    { fontSize: 30, fontWeight: '900', color: COLORS.success },
  pointsSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  homeBtn:   { width: '100%', padding: 15, borderRadius: 16, backgroundColor: COLORS.success, alignItems: 'center',
                elevation: 4 },
  homeBtnText:{ color: 'white', fontWeight: '800', fontSize: 16 },
});
```

- [ ] **Step 2: 实现 StatsScreen.tsx**

```typescript
// src/screens/StatsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useStatsStore } from '../store/statsStore';
import { COLORS } from '../theme/colors';
import SectionLabel from '../components/SectionLabel';
import { ACHIEVEMENTS } from '../utils/achievements';
import { DismissMethod } from '../types';

export default function StatsScreen() {
  const { stats } = useStatsStore();
  const totalMethods = stats.methodCounts.math + stats.methodCounts.blink + stats.methodCounts.shake;

  const topStats = [
    { label: '连续起床', value: String(stats.streakDays), unit: '天', color: COLORS.primary, emoji: '🔥' },
    { label: '累计解锁', value: String(stats.totalUnlocks), unit: '次', color: COLORS.accent, emoji: '📈' },
    { label: '累计积分', value: String(stats.points), unit: 'pts', color: COLORS.warning, emoji: '⭐' },
  ];

  const methodStats: { label: string; emoji: string; count: number; color: string; method: DismissMethod }[] = [
    { label: '答题模式', emoji: '🧮', count: stats.methodCounts.math,  color: COLORS.mathColor,  method: 'math' },
    { label: '眨眼模式', emoji: '👁️',count: stats.methodCounts.blink, color: COLORS.blinkColor, method: 'blink' },
    { label: '摇晃模式', emoji: '📳', count: stats.methodCounts.shake, color: COLORS.shakeColor, method: 'shake' },
  ];

  const weekDays = ['一','二','三','四','五','六','日'];
  const recentLog = stats.weeklyLog.slice(-7);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 我的战绩</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        {/* Top stats */}
        <View style={styles.topRow}>
          {topStats.map(s => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + '25' }]}>
              <Text style={{ fontSize: 20, marginBottom: 2 }}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>
                {s.value}<Text style={{ fontSize: 12 }}>{s.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly record */}
        <View style={styles.card}>
          <SectionLabel>本周记录</SectionLabel>
          <View style={styles.weekRow}>
            {weekDays.map((d, i) => {
              const entry = recentLog[i];
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={styles.dayLabel}>周{d}</Text>
                  <View style={[styles.dayBox, {
                    backgroundColor: !entry ? COLORS.border
                      : entry.success ? COLORS.successLight : COLORS.dangerLight,
                  }]}>
                    <Text style={{ fontSize: 13, fontWeight: '800',
                      color: !entry ? COLORS.textMuted : entry.success ? COLORS.success : COLORS.danger }}>
                      {!entry ? '·' : entry.success ? '✓' : '✗'}
                    </Text>
                  </View>
                  <Text style={[styles.dayTime, { color: entry?.success ? COLORS.success : COLORS.textMuted }]}>
                    {entry?.time ?? '--'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Method breakdown */}
        <View style={styles.card}>
          <SectionLabel>解锁方式使用次数</SectionLabel>
          <View style={{ gap: 10 }}>
            {methodStats.map(ms => (
              <View key={ms.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18, width: 24 }}>{ms.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>{ms.label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: ms.color }}>{ms.count}次</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, {
                      width: totalMethods > 0 ? `${(ms.count / totalMethods) * 100}%` : '0%',
                      backgroundColor: ms.color,
                    }]} />
                  </View>
                </View>
              </View>
            ))}
            <Text style={{ textAlign: 'right', fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 }}>
              共解锁 {totalMethods} 次 🎯
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <SectionLabel>🏅 成就系统</SectionLabel>
          <View style={{ gap: 8 }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = stats.achievements.includes(a.id);
              return (
                <View key={a.id} style={[styles.achieveRow, {
                  backgroundColor: unlocked ? COLORS.primaryLight : '#f7f6ff',
                  opacity: unlocked ? 1 : 0.55,
                }]}>
                  <Text style={{ fontSize: 26, filter: unlocked ? undefined : 'grayscale(1)' }}>{a.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: unlocked ? COLORS.text : COLORS.textMuted }}>
                      {a.name}
                      {unlocked && <Text style={{ fontSize: 11, color: COLORS.primary }}> ✓ 已解锁</Text>}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{a.desc}</Text>
                  </View>
                  {!unlocked && <Text style={{ fontSize: 15 }}>🔒</Text>}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.textMuted, fontWeight: '600', paddingVertical: 4 }}>
          😈 叫不醒你不罢休 · 你的专属起床折磨师
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  header:     { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white',
                 borderBottomWidth: 1, borderBottomColor: '#ede8ff', alignItems: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '800', color: COLORS.text },
  scroll:     { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  topRow:     { flexDirection: 'row', gap: 9 },
  statCard:   { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 12,
                 alignItems: 'center', elevation: 1, borderWidth: 1 },
  statValue:  { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  statLabel:  { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', marginTop: 3 },
  card:       { backgroundColor: 'white', borderRadius: 18, padding: 14, elevation: 1 },
  weekRow:    { flexDirection: 'row', gap: 5, marginTop: 4 },
  dayCol:     { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel:   { fontSize: 10, color: COLORS.textMuted, fontWeight: '700' },
  dayBox:     { width: '100%', aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayTime:    { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  barBg:      { height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 4 },
  achieveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 13 },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/SuccessScreen.tsx src/screens/StatsScreen.tsx
git commit -m "feat: implement SuccessScreen and StatsScreen"
```

---

## Task 15: Android 权限 + notifee 配置 + 启动后恢复闹钟

**Files:**
- Modify: `app.json`
- Create: `src/services/bootReceiver.ts`

- [ ] **Step 1: 更新 app.json 权限**

在 `app.json` 的 `expo.android` 中添加：

```json
{
  "expo": {
    "name": "叫不醒你不罢休",
    "slug": "alarm-clock",
    "version": "1.0.0",
    "android": {
      "package": "com.yourname.alarmclock",
      "permissions": [
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "CAMERA",
        "USE_FULL_SCREEN_INTENT",
        "SCHEDULE_EXACT_ALARM",
        "VIBRATE",
        "USE_EXACT_ALARM"
      ]
    },
    "plugins": [
      "@notifee/react-native",
      [
        "expo-camera",
        { "cameraPermission": "眨眼解锁需要使用前置摄像头检测眨眼动作" }
      ]
    ]
  }
}
```

- [ ] **Step 2: 实现启动后闹钟恢复**

```typescript
// src/services/bootReceiver.ts
import notifee, { EventType } from '@notifee/react-native';
import { useAlarmStore } from '../store/alarmStore';
import { scheduleAlarm } from './notifeeService';

export function registerBootReceiver(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DISMISSED || type === EventType.ACTION_PRESS) {
      // Notification dismissed — no action needed
    }
  });
}

export async function restoreAlarmsAfterBoot(): Promise<void> {
  const alarms = useAlarmStore.getState().alarms;
  for (const alarm of alarms) {
    if (alarm.active) {
      try {
        const jobId = await scheduleAlarm(alarm);
        useAlarmStore.getState().updateAlarm({ ...alarm, notifeeJobId: jobId });
      } catch (e) {
        console.warn(`Failed to restore alarm ${alarm.id}:`, e);
      }
    }
  }
}
```

- [ ] **Step 3: 在 App.tsx 中注册 boot receiver**

在 `App.tsx` 的 `setupNotifee()` 调用后加入：
```typescript
import { registerBootReceiver, restoreAlarmsAfterBoot } from './src/services/bootReceiver';

// 在 useEffect 中：
React.useEffect(() => {
  setupNotifee();
  registerBootReceiver();
  restoreAlarmsAfterBoot();
}, []);
```

- [ ] **Step 4: Commit**

```bash
git add app.json src/services/bootReceiver.ts App.tsx
git commit -m "feat: configure Android permissions, notifee plugin, and boot recovery"
```

---

## Task 16: 构建开发版并真机测试

- [ ] **Step 1: 安装 EAS CLI**

```bash
npm install -g eas-cli
eas login
```

- [ ] **Step 2: 配置 EAS**

```bash
eas build:configure
```

选择 Android。

- [ ] **Step 3: 本地开发构建（需要 Android Studio / JDK）**

```bash
npx expo run:android
```

Expected: App 安装到连接的 Android 设备/模拟器并启动。

- [ ] **Step 4: 手动测试清单**

在真机上逐项确认：

- [ ] 主页显示实时时钟，闹钟列表可上下滚动
- [ ] 点击 + 新建闹钟，时间拨盘可调整，保存后出现在列表
- [ ] 切换 Toggle 开关，闹钟 active 状态正确保存
- [ ] 点击闹钟卡片触发 RingingScreen，铃铛动画正常
- [ ] 答题解锁：3 题全对进入 SuccessScreen，答错显示幽默提示
- [ ] 摇晃解锁：用力摇手机，圆环进度条增长，达到目标后跳转 Success
- [ ] 眨眼解锁：对准摄像头眨眼 3 次，计数器正确增长
- [ ] 统计页面显示正确的解锁次数和成就
- [ ] 设置真实闹钟（1分钟后），锁屏状态下能全屏唤醒并响铃
- [ ] 重启设备后，已设置的闹钟仍然有效

- [ ] **Step 5: 构建 APK（可选，用于分发测试）**

```bash
eas build --platform android --profile preview
```

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "feat: complete 叫不醒你不罢休 alarm clock app v1.0"
```

---

## 自检：规格覆盖确认

| 规格要求 | 覆盖 Task |
|---|---|
| 主页实时时钟 + 闹钟列表 | Task 8 |
| 新建/编辑闹钟（时间拨盘、名称、方式选择） | Task 9 |
| 响铃全屏界面（动画铃铛、脉冲环） | Task 10 |
| 答题解锁（随机 3 题、幽默提示） | Task 11 |
| 摇晃解锁（真实加速度计） | Task 12 |
| 眨眼解锁（摄像头人脸检测） | Task 13 |
| 解锁成功（积分 +10、幽默语） | Task 14 |
| 统计/成就页（周记录、方式统计、8枚徽章） | Task 14 |
| COLORS 常量（oklch → hex） | Task 3 |
| Nunito + Noto Sans SC 字体 | Task 7 |
| Zustand + AsyncStorage 持久化 | Task 5 |
| notifee 精确闹钟触发 | Task 5, 15 |
| Android 权限配置 | Task 15 |
| 重启后恢复闹钟 | Task 15 |
| 成就触发条件（8枚） | Task 4, 5 |
| 单元测试（alarmTime、achievements、stores、组件） | Task 4, 5, 6 |
