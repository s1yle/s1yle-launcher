import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen } from 'lucide-react';
import { selectJavaPath } from '../../helper/rustInvoke';
import { useNotification } from '../common';

interface JavaPathSelectorProps {
  value?: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

const JavaPathSelector: React.FC<JavaPathSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { error: notifyError } = useNotification();

  const handleBrowse = async () => {
    try {
      const path = await selectJavaPath();
      if (path) {
        onChange(path);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notifyError(t('settings.java.selectFailed', '选择 Java 路径失败'), msg);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={t('settings.java.pathPlaceholder', 'Java 可执行文件路径 (java.exe)')}
        className="flex-1 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleBrowse}
        disabled={disabled}
        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        {t('common.browse', '浏览')}
      </button>
    </div>
  );
};

export default JavaPathSelector;
