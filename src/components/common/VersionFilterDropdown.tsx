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
          'bg-surface border border-border hover:border-border-hover',
          isOpen && 'border-primary'
        )}
      >
        <span className="text-text-primary">{selectedOption?.label}</span>
        {selectedOption?.count !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary-bg text-primary text-xs">
            {selectedOption.count}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 text-text-tertiary transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                value === option.value
                  ? 'bg-surface-active text-text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              <span>{option.label}</span>
              <div className="flex items-center gap-2">
                {option.count !== undefined && (
                  <span className="text-text-tertiary text-xs">{option.count}</span>
                )}
                {value === option.value && (
                  <Check className="w-4 h-4 text-primary" />
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
