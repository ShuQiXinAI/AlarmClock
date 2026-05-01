# 叫不醒你不罢休

> 一款"叫不醒你不罢休"的 Android 闹钟 App —— 闹铃响起后必须完成挑战才能关闭，专治赖床。

<p align="center">
  <img src="./闹钟Logo.png" alt="叫不醒你不罢休 Logo" width="200" />
</p>

## 项目简介

普通闹钟的痛点是太容易"一键关闭"，于是很多人闹钟响完接着睡。本项目通过 **强制完成挑战才能停止响铃** 的机制解决这个问题：到达设定时间后，App 会自动唤起手机屏幕（即便处于锁屏状态）、用 **系统闹铃音量通道** 播放系统默认闹铃音，并直接弹出挑战界面，用户必须完成"做算术 / 摇一摇 / 眨眼"中的一项挑战，闹铃才会停止。

本仓库为 **v1.0 初版备份**，是 App 第一个端到端跑通的可发布版本。

## 核心功能

### 🔔 可靠的闹钟触发
- 使用 `@notifee/react-native` 的 `AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE` 精确触发，**不受 Doze / 省电模式影响**
- 支持多个闹钟、单次 / 重复（按星期）触发
- App 启动时自动 `rescheduleAll`，重启手机后闹钟仍生效（声明了 `RECEIVE_BOOT_COMPLETED`）

### 📢 真正的闹钟音（不是通知音）
- **自研 Expo 原生模块** `modules/alarm-sound`（Kotlin）
- 通过 `MediaPlayer` + `AudioAttributes.USAGE_ALARM` 走 **闹钟音量通道**，不再受通知静音影响
- 使用 `RingtoneManager.TYPE_ALARM` 播放系统默认闹铃音
- 若用户把闹钟音量误调为 0，会自动恢复到 60% 防止响不出来

### 🔓 锁屏自动唤起 & 自动跳转挑战界面
- 通过自定义 Expo Config Plugin (`plugins/with-show-when-locked.js`) 在 `AndroidManifest.xml` 中给 MainActivity 加上 `android:showWhenLocked="true"` 和 `android:turnScreenOn="true"`
- notifee `fullScreenAction` 触发后直接覆盖锁屏显示挑战界面
- App.tsx 通过 `getDisplayedNotifications()` + `AppState change` 事件双重保险，处理冷启动 / 热启动 / 后台返回各种情况

### 🧠 三种挑战模式
| 挑战 | 实现 | 通过条件 |
| --- | --- | --- |
| 🧮 算术 | `MathUnlockScreen` + TDD 单元测试 | 连续答对若干道随机加减乘除题 |
| 📳 摇一摇 | `ShakeUnlockScreen` + `useShake` (`expo-sensors` Accelerometer) | 累计达到目标摇动次数 |
| 👁 眨眼 | `BlinkUnlockScreen` + `useBlink` (`expo-camera/legacy` + `expo-face-detector`) | 用前置摄像头检测连续眨眼 |

### 📊 其他
- 闹钟列表 / 编辑 / 删除 / 启用关闭
- 起床成功统计页（连续打卡天数等）
- 一键跳转系统"闹钟与提醒"权限设置（Android 12+ 必需）

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React Native 0.74.5 + **Expo SDK 51 (managed workflow)** |
| 语言 | TypeScript 5.3 + Kotlin（原生模块） |
| 路由 | React Navigation v6 (`stack` + `bottom-tabs`) |
| 状态 | Zustand 5（`alarmStore` + `statsStore`，AsyncStorage 持久化） |
| 通知 / 触发 | @notifee/react-native 9.1.8 |
| 摄像头 / 人脸 | expo-camera 15 (legacy API) + expo-face-detector 13 |
| 传感器 | expo-sensors（Accelerometer） |
| 测试 | jest-expo + @testing-library/react-native |
| 构建 | EAS Build (cloud) |

## 目录结构

```
AlarmClock/
├── App.tsx                       # 入口，集中处理 notifee 事件 → 跳转 RingingScreen
├── index.js                      # 注册 notifee.onBackgroundEvent + registerRootComponent
├── app.json                      # Expo 配置 + 权限 + 自定义插件
├── eas.json                      # EAS 构建配置
├── plugins/
│   └── with-show-when-locked.js  # 自定义 Config Plugin：让 MainActivity 锁屏可见
├── modules/
│   └── alarm-sound/              # 自研 Expo 原生模块（Kotlin）
│       ├── expo-module.config.json
│       └── android/src/main/java/expo/modules/alarmsound/AlarmSoundModule.kt
├── src/
│   ├── screens/                  # 8 个页面：Home/EditAlarm/Ringing/三种挑战/Success/Stats
│   ├── components/               # AlarmCard / ToggleSwitch / 等通用组件
│   ├── hooks/                    # useBlink / useShake
│   ├── services/
│   │   ├── notifeeService.ts     # 通知通道 / 触发调度
│   │   └── alarmAudio.ts         # 调用原生模块播放 / 停止
│   ├── store/                    # Zustand stores
│   ├── navigation/               # AppNavigator
│   ├── theme/                    # 主题样式
│   ├── utils/
│   └── types.ts
├── assets/                       # 图标 / 启动图 / 默认铃声
└── 闹钟Logo.png                  # App Logo
```

## 构建与运行

### 前置条件
- Node.js ≥ 18
- 已安装 `eas-cli`：`npm i -g eas-cli`
- Android 真机（推荐 API 31+）

### 安装依赖
```bash
npm install --legacy-peer-deps
```

> 项目内有 `.npmrc` 已设 `legacy-peer-deps=true`，普通 `npm install` 也可以。

### 云端构建 APK（推荐）
```bash
eas login
eas build --platform android --profile preview
```
构建完成后 EAS 会返回一个 `.apk` 链接，下载到手机直接安装即可。

### 本地开发（Expo Go 不支持原生模块）
本项目用了自研原生模块，**无法用 Expo Go 直接预览**，必须使用 development build：
```bash
eas build --profile development --platform android   # 一次性
npm start                                            # 后续就能热重载
```

### 正式发版到应用市场
- AAB（Google Play）: `eas build --platform android --profile production`
- APK（国内市场）: `eas build --platform android --profile production-apk`
- 详见 [`RELEASE.md`](./RELEASE.md) 完整发布流程

## 必需的 Android 权限

App 启动后请到系统设置中授予：
1. **通知权限**（Android 13+）
2. **闹钟与提醒权限**（Android 12+）—— 首页右上角"权限"按钮可一键跳转
3. **悬浮通知 / 全屏意图**（部分 ROM）
4. 摄像头 / 麦克风（仅在使用眨眼挑战时需要）

国产 ROM（小米 / 华为 / OPPO / vivo）还需额外开启：
- 自启动
- 后台运行
- 锁屏显示
- 关闭电池优化

## v1.0 已知限制 / 后续计划

- [ ] iOS 原生模块尚未实现（当前仅 Android）
- [ ] 闹铃停止后无 fadeout，体验略生硬
- [ ] 缺少自定义铃声选择
- [ ] 暗色模式 / 主题切换尚未做
- [ ] 国产 ROM 自启动权限的引导界面缺失
- [ ] 无云端同步 / 多设备共用闹钟

## 上架相关文档

| 文档 | 用途 |
| --- | --- |
| [`PRIVACY.md`](./PRIVACY.md) | 中文隐私政策（应用市场要求公网托管） |
| [`LISTING.md`](./LISTING.md) | 各应用市场上架文案（标语、描述、权限审核话术等） |
| [`RELEASE.md`](./RELEASE.md) | 完整发布 runbook（资质准备、构建、各市场提交、回滚） |

## 版本记录

### v1.1.0（UI 打磨 + 时间选择器重做）
- ✨ 时间选择器重做：双列（时 / 分）独立设置，每列含 ▲/▼ 微调按钮 + 滚动轮 + 点击非中心数字直接跳转，三种方式都支持
- ✨ 自研 `WheelPicker` 组件：中心高亮带使用主题浅色，选中数字用主色 40px 大号，`tabular-nums` 保持数字宽度稳定
- 🎨 桌面图标使用项目 logo，不再是默认 Expo 占位图
- 🎨 顶部状态栏背景与 App 主背景统一为 `#F5F4FF`，时间/信号/电量始终深色可见
- 🎨 底部 tab 栏比例调整：高度 62px、图标 24px、文字 13px，加粗

### v1.0.0（初版备份）
- ✅ 端到端跑通：到达设定时间，无论锁屏 / 后台 / 前台均自动响铃 + 弹挑战
- ✅ 闹铃走系统闹钟音量通道，不再被通知静音影响
- ✅ 三种挑战（算术 / 摇动 / 眨眼）均可正常通过
- ✅ EAS Build 出包成功，可直接安装运行

## License

源代码公开供审计，**版权归开发者所有**（All Rights Reserved）。
未经书面许可，请勿用于二次发布或商业用途。允许个人学习、阅读、提交 Issue 与 PR。

隐私政策（已托管至 GitHub Pages）：https://shuqixinai.github.io/AlarmClock/PRIVACY
