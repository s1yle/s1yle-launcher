import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface VersionFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface VersionFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: VersionFilterOption[];
  className?: string;
}

const VersionFilterDropdown: React.FC<VersionFilterDropdownProps> = ({
  value,
  onChange,
  options,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
          'border hover:border-[var(--color-border-hover)]',
          isOpen && 'border-[var(--color-primary)]'
        )}
        style={{ backgroundColor: 'var(--color-surface-solid)', borderColor: 'var(--color-border)' }}
      >
        <span style={{ color: 'var(--color-text-primary)' }}>{selectedOption?.label}</span>
        {selectedOption?.count !== undefined && (
          <span 
            className="px-1.5 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}
          >
            {selectedOption.count}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-1 left-0 z-[100] min-w-full border rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-solid)', borderColor: 'var(--color-border)' }}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors'
              )}
              style={{ 
                backgroundColor: value === option.value ? 'var(--color-surface-active)' : 'transparent',
                color: value === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              <span>{option.label}</span>
              <div className="flex items-center gap-2">
                {option.count !== undefined && (
                  <span style={{ color: 'var(--color-text-tertiary)' }} className="text-xs">{option.count}</span>
                )}
                {value === option.value && (
                  <Check className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionFilterDropdown;
