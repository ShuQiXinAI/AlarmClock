import { Platform } from 'react-native';

export type Brand =
  | 'vivo'
  | 'xiaomi'
  | 'huawei'
  | 'honor'
  | 'oppo'
  | 'realme'
  | 'samsung'
  | 'unknown';

export function detectBrand(): Brand {
  if (Platform.OS !== 'android') return 'unknown';
  const constants = Platform.constants as { Manufacturer?: string; Brand?: string };
  const haystack = `${constants?.Manufacturer ?? ''} ${constants?.Brand ?? ''}`.toLowerCase();
  if (haystack.includes('vivo') || haystack.includes('iqoo')) return 'vivo';
  if (
    haystack.includes('xiaomi') ||
    haystack.includes('redmi') ||
    haystack.includes('poco')
  )
    return 'xiaomi';
  if (haystack.includes('huawei')) return 'huawei';
  if (haystack.includes('honor')) return 'honor';
  if (haystack.includes('oppo')) return 'oppo';
  if (haystack.includes('realme')) return 'realme';
  if (haystack.includes('samsung')) return 'samsung';
  return 'unknown';
}

interface BrandGuide {
  title: string;
  intro: string;
  steps: string[];
}

export const BRAND_GUIDES: Record<Brand, BrandGuide | null> = {
  vivo: {
    title: 'vivo / OriginOS / iQOO',
    intro: 'vivo 杀后台较狠，必须做这一步：',
    steps: [
      '上滑进最近任务页',
      '长按本 App 卡片',
      '点击 🔒 锁定图标',
      '锁定后即可保证锁屏 / 后台到点正常响铃',
    ],
  },
  xiaomi: {
    title: '小米 / Redmi / MIUI / HyperOS',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 应用设置 → 应用管理 → 找到本 App',
      '自启动 → 打开',
      '省电策略 → 选"无限制"',
      '最近任务页 → 下拉本 App 卡片 → 点 🔒 锁定',
    ],
  },
  huawei: {
    title: '华为 / HarmonyOS / EMUI',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 应用 → 应用启动管理 → 找到本 App',
      '关闭"自动管理"',
      '将"自启动 / 关联启动 / 后台活动"三项全部打开',
    ],
  },
  honor: {
    title: '荣耀 / MagicOS',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 应用 → 应用启动管理 → 找到本 App',
      '关闭"自动管理"',
      '将三项开关（自启动 / 关联启动 / 后台活动）全部打开',
    ],
  },
  oppo: {
    title: 'OPPO / ColorOS',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 电池 → 应用耗电管理 → 找到本 App → 允许后台活动',
      '设置 → 应用管理 → 找到本 App → 允许自启动',
      '最近任务 → 下拉本 App 卡片 → 锁定',
    ],
  },
  realme: {
    title: 'realme UI',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 电池 → 应用耗电管理 → 找到本 App → 允许后台活动',
      '设置 → 应用管理 → 找到本 App → 允许自启动',
    ],
  },
  samsung: {
    title: '三星 / One UI',
    intro: '请按以下步骤设置：',
    steps: [
      '设置 → 应用 → 找到本 App → 电池 → 选"不受限"',
      '设备维护 → 电池 → 应用电源管理 → 不要将本 App 加入睡眠',
    ],
  },
  unknown: null,
};
