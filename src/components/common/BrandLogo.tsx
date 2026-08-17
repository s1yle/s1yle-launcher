import { cn } from '@/utils/cn';

/** BrandLogo 组件的 Props */
export interface BrandLogoProps {
  /** 渲染宽度（px），高度按 logo 原始宽高比自动 */
  width?: number;
  className?: string;
}

/**
 * 品牌 Logo 组件。
 * 引用 public/logo.svg（由 scripts/gen-logo.ts 从 src/assets/logo.svg 生成）。
 */
const BrandLogo = ({ width = 40, className }: BrandLogoProps) => (
  <img
    src="/logo.svg"
    alt="WeCraft! Launcher"
    width={width}
    draggable={false}
    className={cn('h-auto', className)}
  />
);

export default BrandLogo;