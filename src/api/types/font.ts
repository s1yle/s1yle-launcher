export interface SystemFont {
  name: string,
}

/** 字体类型（与 Rust FontType 枚举对应） */
export type FontType = 'CURRENT' | 'SERIF' | 'SANS' | 'MONO';

/** Rust get_font 返回值：每种字体类型映射到对应的 SystemFont */
export type FontMap = Record<FontType, SystemFont>;
