import React from 'react';

export interface BlockIconProps {
  src?: string;
  w?: number;
  h?: number;
  className?: string;
  alt?: string;
}

const BlockIcon: React.FC<BlockIconProps> = ({ src, w = 8, h = 8, className, alt = '' }) => {
  if (!src) return null;
  return <img 
    src={src} 
    alt={alt} 
    className={`
      ${"w-" + w}
      ${"h-" + h}
      ${className}`
    } 
    draggable={false} 
  />;
};

export default BlockIcon;