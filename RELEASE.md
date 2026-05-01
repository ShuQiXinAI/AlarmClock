# 发布流程 Runbook

> 本文档记录从代码到上架应用市场的完整流程。每次发新版按本表执行。

---

## A. 一次性准备工作（仅首次上架前做）

### A1. 法律资质（流程长，先开始）

- [ ] **办理软件著作权**
  - 申请地址：https://register.ccopyright.com.cn
  - 个人申请人即可
  - 自办：免费 / 30+ 工作日；代办：约 300-500 元 / 3-5 工作日
  - 准备材料：
    - 源代码 PDF（前 30 页 + 后 30 页）
    - 操作说明书 PDF（含截图）
    - 个人身份证扫描件
    - 申请表（在官网下载模板）

- [ ] **托管隐私政策到 GitHub Pages**
  1. 进入 https://github.com/ShuQiXinAI/AlarmClock/settings/pages
  2. Source 选 `Deploy from a branch`，Branch 选 `master` + `/ (root)`
  3. Save，等约 1 分钟
  4. 验证可访问：https://shuqixinai.github.io/AlarmClock/PRIVACY/

- [ ] **准备开发者邮箱**（不要用日常邮箱）
  - 建议注册一个专用邮箱，如 `appasyouself.alarm@outlook.com`

### A2. 应用市场账号（每个市场各做一次）

| 渠道 | 注册地址 | 实名认证耗时 |
| --- | --- | --- |
| 华为 AppGallery | https://developer.huawei.com | 1-2 天 |
| 小米开放平台 | https://dev.mi.com | 1 天 |
| OPPO 开放平台 | https://open.oppomobile.com | 2-3 天 |
| vivo 开放平台 | https://dev.vivo.com.cn | 2-3 天 |
| 应用宝 | https://open.tencent.com | 1-2 天 |

每家都需要：身份证正反面 + 手持身份证照 + 银行卡四要素验证 / 支付宝扫脸。

### A3. 备份 EAS keystore（**极其重要**）

```powershell
eas credentials -p android
```

- 选择 production profile
- 选择 "Download credentials"
- **将下载的 `keystore.jks` 文件 + 密码、key alias、key password** 全部备份到至少 2 个位置（如：本地加密硬盘 + 1Password）
- ⚠️ keystore 一旦丢失，App **永远无法以同一身份发版**，用户必须卸载重装

---

## B. 每次发版流程

### B1. 发版前检查清单

- [ ] 所有功能在真机上验证通过（特别是锁屏自动响铃）
- [ ] `package.json` 和 `app.json` 中 `version` 已更新（如 `1.1.0` → `1.2.0`）
- [ ] 所有改动已 commit 并推送到 GitHub
- [ ] 已创建对应的 git tag（如 `v1.2.0`）
- [ ] 在 GitHub 创建 Release 并撰写 release notes
- [ ] 如有新增权限，已更新 `PRIVACY.md` 与 `LISTING.md` 的权限审核话术

### B2. 构建正式版本

**Google Play（AAB 格式）：**
```powershell
eas build --platform android --profile production
```

**国内市场（APK 格式）：**
```powershell
eas build --platform android --profile production-apk
```

`autoIncrement: "versionCode"` 已配置好，每次构建 versionCode 会自动 +1。

构建完成后：
- 下载产物到本地
- 在 1-2 台真机安装验证（务必先卸载旧版再装，避免签名冲突）

### B3. 上传各应用市场（提交后审核 1-3 天）

每个市场流程类似：

1. 登录开发者后台 → 我的应用 → 创建应用 / 选择应用
2. 填写应用信息（首次发版）：
   - 应用名：`叫不醒你不罢休`（来自 `LISTING.md` §1）
   - 包名：`com.shuqixin.alarmclock`
   - 主分类：实用工具 / 效率
   - 一句话简介：来自 `LISTING.md` §2
   - 应用描述：来自 `LISTING.md` §4
   - 应用图标 / 截图 / 横幅：见 `LISTING.md` §10
   - 隐私政策 URL：https://shuqixinai.github.io/AlarmClock/PRIVACY/
   - 联系方式：开发者邮箱
3. 上传 APK / AAB
4. 上传软著证书（PDF）
5. 敏感权限说明：复制 `LISTING.md` §8 的话术
6. 提交审核

### B4. 各市场特殊点

- **华为**：审核最严，必看软著、必查所有敏感权限的"使用场景说明"
- **小米**：可在审核备注中预先写上敏感权限说明，减少打回
- **OPPO / vivo**：会要求填写 "应用主要使用场景描述"，用 `LISTING.md` §4 即可
- **应用宝**：相对宽松，但要求隐私政策有清晰的入口（已在 App 内保留 GitHub 链接即可）

### B5. 审核被拒应对

常见拒因 → 应对：

| 拒因 | 解法 |
| --- | --- |
| "敏感权限使用说明不清晰" | 用 `LISTING.md` §8 的话术补充提交 |
| "隐私政策不可访问" | 检查 GitHub Pages 是否生效，或换一份托管 |
| "版本号未递增" | EAS profile 已配置 autoIncrement，重新 build 一次 |
| "应用截图与功能不符" | 重拍截图，确保能看清 App 的核心功能 |
| "未提供软著证明" | 重新上传软著 PDF |

### B6. 上架后

- [ ] 在所有市场验证应用列表中可见、可下载、可安装
- [ ] 在 GitHub Release 描述中加上各市场的应用链接
- [ ] 记录发版日期到 `README.md` 版本记录中

---

## C. 紧急回滚 / 下架流程

如发版后发现严重 bug：

1. 立即在所有应用市场后台**手动下架** （华为、小米、OPPO、vivo、应用宝都支持一键下架）
2. 修复 bug、重新构建并提升 versionCode
3. 重新提审

> ⚠️ 已经下载安装到用户手机的版本无法回收。所以**发版前的真机测试不能省**。

---

## D. 推荐时间线参考

| 阶段 | 内容 | 时间 |
| --- | --- | --- |
| Day 1-3 | 申请软著（加急） | 3-5 工作日 |
| Day 1 | GitHub Pages 部署隐私政策 | 1 小时 |
| Day 1 | 注册各市场开发者账号 + 实名认证 | 1-3 天平行进行 |
| Day 2 | 真机拍摄应用截图 + 制作横幅 | 半天 |
| Day 3 | EAS production build + 备份 keystore | 1 小时 |
| Day 5-7 | 软著到手 → 各市场提交审核 | 1 天 |
| Day 8-10 | 审核通过 → 上架 | 1-3 天 |

**总计约 7-10 个工作日**完成首批上架。

---

## E. 后续运营建议

- 每发新版本，至少 24 小时内不要改动代码（防止 hotfix 撞上用户反馈）
- 关注各应用市场的开发者后台**用户评论**，及时回复
- 关键 bug 通过快速发版修复（华为有"快速更新"通道，可缩短审核时长）
- 定期检查 `Android target API` 要求（Google Play 每年提升一次，国内市场一般晚一年跟进）
