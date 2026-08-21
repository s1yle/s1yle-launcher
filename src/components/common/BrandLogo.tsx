import { cn } from '@/utils/cn';
import logoSvg from '@/assets/logo.svg?raw';

/** BrandLogo 组件的 Props */
export interface BrandLogoProps {
  /** 渲染宽度（px），高度按 logo 原始宽高比自动 */
  width?: number;
  className?: string;
  /** 是否对第一个 path（白色面）应用呼吸动画 */
  animated?: boolean;
}

/**
 * 品牌 Logo 组件。
 * 通过 Vite 内置的 ?raw 直接读取唯一事实源 src/assets/logo.svg（由 scripts/gen-logo.ts 维护），
 */
const BrandLogo = ({ width = 40, className, animated = false }: BrandLogoProps) => (
  <span
    className={cn('brand-logo', className)}
    style={{ width, display: 'inline-block' }}
  >
    <style>{`
      .brand-logo__svg { display: block; width: 100%; }
      .brand-logo__svg svg { width: 100%; height: auto; display: block; }
      ${animated ? `
      .brand-logo__svg svg path:first-of-type {
        animation: change1 2.5s ease-in-out infinite;
      }
      @keyframes change1 {
        0% {
          opacity: 100%;
        }
        50% {
          opacity: 50%;
        }
        100% {
          opacity: 100%;
        }
      }
      ` : ''}
    `}</style>
    <span className="brand-logo__svg" dangerouslySetInnerHTML={{ __html: logoSvg }} />
  </span>
);

export default BrandLogo;
