/**
 * 背景类型
 */
export type BackgroundType = 'none' | 'color' | 'gradient' | 'image'

/** 背景配置 */
export interface BackgroundConfig {
  type: BackgroundType
  color?: string
  gradient?: string
  imagePath?: string
  imageFit?: 'cover' | 'contain' | 'fill' | 'tile'
  opacity: number
  blur: number
  overlayColor: string
  overlayOpacity: number
}