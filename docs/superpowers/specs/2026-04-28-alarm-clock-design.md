# 叫不醒你不罢休 · Android 闹钟 App — 设计规格

_日期：2026-04-28_

---

## 1. 背景与目标

一款专为起床困难上班族设计的趣味闹钟 App。核心差异点：关闭闹铃必须完成特定挑战（答题 / 眨眼 / 摇晃），杜绝一键关闭。风格定位：清爽活力 + 幽默整蛊。

平台：Android（首期），技术栈：React Native + Expo。

---

## 2. 技术栈

| 依赖 | 用途 |
|---|---|
| React Native 0.75+ (新架构) | 核心框架 |
| Expo SDK 51（托管工作流） | 构建、权限、原生模块 |
| React Navigation 7 | Stack + Tab 导航 |
| Zustand + persist | 全局状态 + AsyncStorage 持久化 |
| notifee | 精确闹钟触发、全屏通知、前台 Service |
| expo-av | 铃声播放 |
| expo-sensors | 加速度计（摇晃检测） |
| expo-camera + expo-face-detector | 前置摄像头眨眼检测 |
| expo-font | Nunito + Noto Sans SC 字体 |
| expo-linear-gradient | 渐变背景 |
| AsyncStorage | 数据持久化底层 |

---

## 3. 目录结构

```
src/
  screens/
    HomeScreen.tsx
    EditAlarmScreen.tsx
    RingingScreen.tsx
    MathUnlockScreen.tsx
    BlinkUnlockScreen.tsx
    ShakeUnlockScreen.tsx
    SuccessScreen.tsx
    StatsScreen.tsx
  components/
    ToggleSwitch.tsx
    DismissBadge.tsx
    BackButton.tsx
    SectionLabel.tsx
    AlarmCard.tsx
  store/
    alarmStore.ts
    statsStore.ts
  hooks/
    useAlarmScheduler.ts
    useShake.ts
    useBlink.ts
  theme/
    colors.ts        # COLORS 常量（oklch → hex/rgba）
    typography.ts    # 字体配置
  utils/
    alarmTime.ts     # 下次触发时间计算
    achievements.ts  # 成就解锁判断
```

---

## 4. 导航结构

```
RootStack
├── TabNavigator（底部 Tab）
│   ├── HomeScreen
│   └── StatsScreen
├── EditAlarmScreen（modal）
├── RingingScreen（全屏锁屏覆盖）
└── UnlockStack
    ├── MathUnlockScreen
    ├── BlinkUnlockScreen
    ├── ShakeUnlockScreen
    └── SuccessScreen
```

---

## 5. 数据模型

```typescript
type DismissMethod = 'math' | 'blink' | 'shake';

interface Alarm {
  id: string;
  time: string;          // "HH:mm"
  label: string;
  method: DismissMethod;
  active: boolean;
  repeatDays: number[];  // 0=周日,1=周一…6=周六；空数组=仅响一次
  notifeeJobId?: string;
}

interface Stats {
  streakDays: number;
  totalUnlocks: number;
  points: number;
  methodCounts: Record<DismissMethod, number>;
  weeklyLog: { date: string; success: boolean; time: string }[];
  achievements: string[];
}
```

---

## 6. 状态管理

**alarmStore**（Zustand + persist）
- `alarms: Alarm[]`
- `addAlarm(alarm)` — 添加并调度
- `updateAlarm(alarm)` — 更新并重新调度
- `deleteAlarm(id)` — 删除并取消触发器
- `toggleAlarm(id, active)` — 开关并同步 notifee

**statsStore**（Zustand + persist）
- `stats: Stats`
- `recordSuccess(method, time)` — 更新积分、连续天数、成就

---

## 7. 原生功能实现

### 7.1 闹钟触发（notifee）

- 使用 `TimestampTrigger` 精确触发
- Android 配置：`fullScreenAction`、`importance: HIGH`、前台 Service
- 权限：`SCHEDULE_EXACT_ALARM`（Android 12+）、`USE_FULL_SCREEN_INTENT`、`WAKE_LOCK`、`RECEIVE_BOOT_COMPLETED`
- App 重启后通过 `RECEIVE_BOOT_COMPLETED` 广播恢复所有 active 闹钟的 notifee 触发器

### 7.2 摇晃检测（expo-sensors）

- `Accelerometer` 采样率 100ms
- 合加速度 `√(x²+y²+z²) > 1.8g` → 计数 +1
- 累计 30 次 → 解锁成功

### 7.3 眨眼检测（expo-camera + expo-face-detector）

- 前置摄像头实时帧
- `FaceDetector.detectFacesAsync` → `leftEyeOpenProbability` + `rightEyeOpenProbability`
- 双眼同时 < 0.3 → 判定眨眼
- 累计 3 次 → 解锁成功

### 7.4 答题解锁

- 随机生成 3 道加减乘法（与设计稿逻辑一致）
- 答错显示幽默提示，答对继续下一题
- 全部答对 → 解锁成功

---

## 8. 视觉还原

- **配色**：oklch 色值转为 hex/rgba（RN 不支持 oklch）；以下为近似值，实现时用 oklch→sRGB 工具精确转换后写入 `colors.ts`
  - primary: `#3730B8`（oklch 0.52 0.30 272）
  - accent: `#C026A8`（oklch 0.58 0.29 325）
  - danger: `#D97706`（oklch 0.68 0.22 38）
  - success: `#16A34A`（oklch 0.65 0.20 162）
- **字体**：Nunito（数字/英文）+ Noto Sans SC（中文），expo-font 加载
- **动画**：`bell-shake`、`pulse-ring`、`phone-shake`、`pop-in` 用 `react-native-reanimated` 实现
- **渐变**：`expo-linear-gradient`
- **阴影**：RN `shadow*` 属性（iOS）+ `elevation`（Android）

---

## 9. 成就系统

| ID | 名称 | 触发条件 |
|---|---|---|
| first_unlock | 初出茅庐 | 首次解锁成功 |
| early_bird | 早起的鸟儿 | 解锁时间 < 06:00 |
| math_genius | 数学天才 | 连续 10 次 math 零错误 |
| streak_7 | 卧薪尝胆 | streakDays ≥ 7 |
| shake_10k | 摇摇先生 | methodCounts.shake ≥ 10000 |
| blink_50 | 千里眼 | methodCounts.blink ≥ 50 |
| streak_30 | 卷王之王 | streakDays ≥ 30 |
| hard_sleeper | 起床困难户 | 闹钟响铃后超过 5 分钟未完成解锁（自动取消视为失败），连续 3 次 |

---

## 10. 测试策略

| 层级 | 工具 | 覆盖内容 |
|---|---|---|
| 单元测试 | Jest | 答题逻辑、时间计算、成就触发 |
| 组件测试 | RNTL | ToggleSwitch、DismissBadge、各解锁屏 |
| 集成测试 | Detox（可选） | 主页→响铃→解锁→成功完整流程 |
| 手动测试 | Android 真机 | 锁屏唤醒、摇晃/眨眼灵敏度调优 |

---

## 11. 构建与权限

**AndroidManifest 权限**
```
WAKE_LOCK
RECEIVE_BOOT_COMPLETED
CAMERA
USE_FULL_SCREEN_INTENT
SCHEDULE_EXACT_ALARM
VIBRATE
```

**构建命令**
```bash
expo start                          # 开发调试
eas build --platform android        # 生成 .apk / .aab
```

---

## 12. 范围外（首期不包含）

- iOS 版本
- 声音/铃声自定义
- 云同步
- 难度选择（简单/困难）
- 社交/排行榜功能
