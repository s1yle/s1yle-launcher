import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeStore, type TerminalTheme, themePresets } from '@/stores/themeStore';

interface TerminalThemePreviewProps {
  onSelect?: (terminalTheme: TerminalTheme | undefined) => void;
  compact?: boolean;
}

const TerminalThemePreview = ({ onSelect, compact = false }: TerminalThemePreviewProps) => {
  const { t } = useTranslation();
  const { terminalTheme: currentTerminalTheme, setTerminalTheme, applyPreset } = useThemeStore();

  const terminalPresets = themePresets.filter(p => p.terminalTheme);

  const handleSelect = async (preset: typeof terminalPresets[0]) => {
    if (onSelect) {
      onSelect(preset.terminalTheme);
    } else {
      // 如果当前已经是这个终端主题，则取消选择
      if (currentTerminalTheme === preset.terminalTheme) {
        await setTerminalTheme(undefined);
        // 恢复到默认暗色主题
        const defaultPreset = themePresets.find(p => p.id === 'dark');
        if (defaultPreset) {
          await applyPreset(defaultPreset);
        }
      } else {
        await applyPreset(preset);
      }
    }
  };

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {terminalPresets.map((preset) => {
          const isActive = currentTerminalTheme === preset.terminalTheme;
          return (
            <motion.button
              key={preset.id}
              onClick={() => handleSelect(preset)}
              className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                isActive
                  ? 'border-[var(--color-primary)] shadow-lg'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
              }`}
              style={{
                background: preset.previewColors.bg,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="w-full h-16 rounded mb-2 flex items-center justify-center text-xs font-mono"
                style={{ background: preset.previewColors.surface, color: preset.previewColors.accent }}
              >
                {preset.name}
              </div>
              <div
                className="text-center font-medium text-sm"
                style={{ color: preset.previewColors.text }}
              >
                {preset.name}
              </div>
              {isActive && (
                <motion.div
                  layoutId="terminal-active-indicator"
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: preset.previewColors.accent }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-4">
        {terminalPresets.map((preset) => {
          const isActive = currentTerminalTheme === preset.terminalTheme;
          const themeClass = `theme-${preset.terminalTheme}` as const;

          return (
            <motion.div
              key={preset.id}
              onClick={() => handleSelect(preset)}
              className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                isActive
                  ? 'border-[var(--color-primary)] shadow-xl'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* 预览窗口 */}
              <div className={`${themeClass} p-5`}>
                {/* 顶部标题栏 */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
                    {preset.name}
                  </span>
                </div>

                {/* 代码预览 */}
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-tertiary)]">$</span>
                    <span className="text-[var(--color-text-primary)]">s1yle-launcher</span>
                    <span className="text-[var(--color-primary)]">--version</span>
                  </div>
                  <div className="text-[var(--color-success)]">
                    ✓ v0.1.3 ready
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-tertiary)]">$</span>
                    <span className="terminal-cursor" />
                  </div>
                </div>

                {/* 特性标签 */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                  <div className="flex gap-2 flex-wrap">
                    {preset.id === 'github' && (
                      <>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          GitHub Dark
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          Professional
                        </span>
                      </>
                    )}
                    {preset.id === 'onedark' && (
                      <>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          Atom Style
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          Warm & Comfortable
                        </span>
                      </>
                    )}
                    {preset.id === 'nord' && (
                      <>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          Arctic
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary-10)] text-[var(--color-primary)] font-mono">
                          Minimalist
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部信息栏 */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'var(--color-surface-solid)' }}
              >
                <div>
                  <h4 className="font-semibold text-[var(--color-text-primary)]">{preset.name}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{preset.description}</p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      background: 'var(--color-primary-bg)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Active
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 提示信息 */}
      <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
          <span className="text-base">💡</span>
          <span>
            {t(
              'theme.terminal.tip',
              '点击主题卡片即可应用。再次点击可恢复默认主题。所有设置会自动保存。'
            )}
          </span>
        </p>
      </div>
    </div>
  );
};

export default TerminalThemePreview;
