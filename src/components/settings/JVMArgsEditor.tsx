import React from 'react';
import { useTranslation } from 'react-i18next';

interface JVMArgsEditorProps {
  value?: string[];
  onChange: (args: string[]) => void;
  disabled?: boolean;
}

const JVMArgsEditor: React.FC<JVMArgsEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const args = value || [];
  const { t } = useTranslation();
  const [inputValue, setInputValue] = React.useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    const newArgs = args.filter((_, i) => i !== index);
    onChange(newArgs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t('settings.java.jvmArgsPlaceholder', '输入 JVM 参数，例如：-XX:+UseG1GC')}
          className="flex-1 px-3 py-2 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('common.add', '添加')}
        </button>
      </div>

      {args && args.length > 0 && (
        <div className="space-y-1">
          {args.map((arg, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm"
            >
              <code className="text-[var(--color-text-secondary)]">{arg}</code>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] disabled:opacity-50 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-[var(--color-text-tertiary)]">
        {t('settings.java.jvmArgsTip', '按 Enter 键添加参数，点击 × 删除参数')}
      </div>
    </div>
  );
};

export default JVMArgsEditor;
