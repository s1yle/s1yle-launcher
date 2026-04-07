import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface LoaderIconProps {
  type: 'minecraft' | 'forge' | 'neoforge' | 'optifine' | 'fabric' | 'fabricApi' | 'quilt' | 'qsl';
  className?: string;
}

const LoaderIcon: React.FC<LoaderIconProps> = ({ type, className }) => {
  switch (type) {
    case 'minecraft':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#5B8C5A" />
          <rect x="1" y="1" width="14" height="7" fill="#5B8C5A" />
          <rect x="1" y="8" width="14" height="7" fill="#8B6914" />
          <rect x="2" y="2" width="5" height="5" fill="#4A7A44" />
          <rect x="9" y="2" width="5" height="5" fill="#7DB36A" />
          <rect x="2" y="9" width="5" height="5" fill="#A67C00" />
          <rect x="9" y="9" width="5" height="5" fill="#6B4F0A" />
        </svg>
      );

    case 'forge':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#1a1a1a" />
          <rect x="3" y="3" width="10" height="10" fill="#2d2d2d" stroke="#444" strokeWidth="0.5" />
          <rect x="5" y="5" width="6" height="6" fill="#3d3d3d" />
          <text x="8" y="10" textAnchor="middle" fill="#FFB300" fontSize="5" fontFamily="monospace" fontWeight="bold">F</text>
        </svg>
      );

    case 'neoforge':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#1a1a2e" />
          <rect x="3" y="3" width="10" height="10" fill="#2d2d44" stroke="#4a4a8a" strokeWidth="0.5" />
          <circle cx="8" cy="8" r="3" fill="#FF6B35" />
          <path d="M6 8 L8 6 L10 8 L8 10 Z" fill="#FFD93D" />
        </svg>
      );

    case 'optifine':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#CC0000" />
          <text x="8" y="11" textAnchor="middle" fill="#FFEE00" fontSize="8" fontFamily="sans-serif" fontWeight="bold">OF</text>
        </svg>
      );

    case 'fabric':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#D4D4D4" />
          <rect x="2" y="2" width="5" height="5" fill="#B8B8B8" />
          <rect x="9" y="2" width="5" height="5" fill="#E8E8E8" />
          <rect x="2" y="9" width="5" height="5" fill="#C8C8C8" />
          <rect x="9" y="9" width="5" height="5" fill="#F0F0F0" />
          <rect x="3" y="3" width="3" height="3" fill="#A8A8A8" />
        </svg>
      );

    case 'fabricApi':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#B8D4E8" />
          <rect x="3" y="3" width="4" height="4" fill="#A8C4DC" />
          <rect x="9" y="3" width="4" height="4" fill="#C8E4F4" />
          <rect x="3" y="9" width="4" height="4" fill="#98B4CC" />
          <rect x="9" y="9" width="4" height="4" fill="#D8F4FF" />
          <text x="8" y="9" textAnchor="middle" fill="#3A8AC8" fontSize="4" fontFamily="sans-serif" fontWeight="bold">API</text>
        </svg>
      );

    case 'quilt':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#3A3A3A" />
          <rect x="1" y="1" width="7" height="7" fill="#C62828" />
          <rect x="8" y="1" width="7" height="7" fill="#1565C0" />
          <rect x="1" y="8" width="7" height="7" fill="#2E7D32" />
          <rect x="8" y="8" width="7" height="7" fill="#F9A825" />
        </svg>
      );

    case 'qsl':
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#2A2A4A" />
          <rect x="2" y="2" width="12" height="4" fill="#4A4A7A" />
          <rect x="2" y="7" width="12" height="4" fill="#3A3A5A" />
          <rect x="2" y="12" width="12" height="2" fill="#5A5A8A" />
          <text x="8" y="10" textAnchor="middle" fill="#9E9ECA" fontSize="3" fontFamily="monospace">QSL/QF</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 16 16" className={cn('w-full h-full', className)}>
          <rect x="1" y="1" width="14" height="14" fill="#888" />
          <text x="8" y="11" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="sans-serif">?</text>
        </svg>
      );
  }
};

export default LoaderIcon;
