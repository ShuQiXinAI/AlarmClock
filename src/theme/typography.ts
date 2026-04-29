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
