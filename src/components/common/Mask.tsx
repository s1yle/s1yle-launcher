import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MaskProps {
  active: boolean;
  children: React.ReactNode;
  label?: string;
  labelI18nKey?: string;
  description?: string;
  descriptionI18nKey?: string;
  className?: string;
  overlayClassName?: string;
  disabled?: boolean;
}

const Mask: React.FC<MaskProps> = ({
  active,
  children,
  label,
  labelI18nKey,
  description,
  descriptionI18nKey,
  className = '',
  overlayClassName = '',
  disabled = false,
}) => {
  const { t } = useTranslation();

  const displayLabel = labelI18nKey ? t(labelI18nKey, label || '') : label;
  const displayDescription = descriptionI18nKey ? t(descriptionI18nKey, description || '') : description;

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}

      {active && (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-[2px] ${overlayClassName}`}
          style={{
            backgroundColor: 'var(--color-overlay)',
            margin: '-15px',
          }}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-4 bg-[var(--color-surface-solid)] border border-[var(--color-border)] rounded-xl shadow-lg">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary-bg)]">
              {active ? (
                <Lock className="w-5 h-5 text-[var(--color-primary)]" />
              ) : (
                <Unlock className="w-5 h-5 text-[var(--color-text-tertiary)]" />
              )}
            </div>
            {displayLabel && (
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {displayLabel}
              </span>
            )}
            {displayDescription && (
              <span className="text-xs text-[var(--color-text-secondary)] text-center max-w-xs">
                {displayDescription}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mask;
