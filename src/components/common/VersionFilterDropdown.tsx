import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { VersionCategory, countVersionsByCategory } from '../../utils/versionFilter';
import { GameVersion } from '../../helper/rustInvoke';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface VersionFilterOption {
  value: VersionCategory;
  label: string;
  count?: number;
}

export interface VersionFilterDropdownProps {
  value: VersionCategory;
  onChange: (value: VersionCategory) => void;
  versions: GameVersion[];
  className?: string;
}

const VersionFilterDropdownInner: React.FC<VersionFilterDropdownProps> = ({
  value,
  onChange,
  versions,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => countVersionsByCategory(versions), [versions]);

  const options: VersionFilterOption[] = useMemo(() => [
    { value: 'all', label: t('download.versionFilter.all'), count: counts.all },
    { value: 'release', label: t('download.versionFilter.release'), count: counts.release },
    { value: 'snapshot', label: t('download.versionFilter.snapshot'), count: counts.snapshot },
    { value: 'april', label: t('download.versionFilter.aprilFool'), count: counts.april },
    { value: 'old', label: t('download.versionFilter.old'), count: counts.old },
  ], [t, counts]);

  const selectedOption = useMemo(() => 
    options.find(o => o.value === value), 
  [options, value]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleOptionClick = useCallback((optionValue: VersionCategory) => {
    onChange(optionValue);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all'
        )}
        style={{ 
          backgroundColor: 'var(--color-surface-solid)', 
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <span style={{ color: 'var(--color-text-primary)' }}>{selectedOption?.label}</span>
        {selectedOption?.count !== undefined && (
          <span 
            className="px-1.5 py-0.5 rounded-full text-xs"
            style={{ 
              backgroundColor: 'var(--color-primary-bg)', 
              color: 'var(--color-primary)' 
            }}
          >
            {selectedOption.count}
          </span>
        )}
        <ChevronDown 
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} 
          style={{ color: 'var(--color-text-tertiary)' }} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-1 left-0 z-[100] min-w-full border rounded-lg shadow-lg overflow-hidden"
          style={{ 
            backgroundColor: 'var(--color-surface-solid)', 
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
              style={{ 
                backgroundColor: value === option.value ? 'var(--color-surface-active)' : 'transparent',
                color: value === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
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

const VersionFilterDropdown = memo(VersionFilterDropdownInner);

export default VersionFilterDropdown;