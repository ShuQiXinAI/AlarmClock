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
