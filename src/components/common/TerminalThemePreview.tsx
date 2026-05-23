import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeStore, themePresets, ThemePreset } from '@/stores/themeStore';
import YesOrNoBadge from './Badge/YesOrNoBadge';
import { ComponentStackLayer } from './ContextStack/ContextStack';

interface TerminalThemePreviewProps {
  onSelect?: (theme: ThemePreset | undefined) => void;
  compact?: boolean;
}

const TerminalThemePreview = ({
  onSelect, compact = false
}: TerminalThemePreviewProps) => {
  const { t } = useTranslation();
  const { applyPreset } = useThemeStore();

  const activeTheme = useThemeStore((state) => state.activeTheme);

  const theme_presets = themePresets;

  const handleSelect = async (preset: typeof theme_presets[0]) => {
    if (onSelect) {
      onSelect(preset);
    } else {
      await applyPreset(preset);
    }
  };

  if (compact) {
    return (
      <ComponentStackLayer type='TerminalThemePreview'>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {theme_presets.map((preset) => {
            return (
              <motion.button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className={`relative p-3 rounded-(--radius-sm) 
                  cursor-pointer hover:scale-1.2
                  ${activeTheme.id == preset.id && '-translate-y-2'}
                  hover:shadow-(--shadow-md)`
                }
                style={{
                  background: preset.previewColors.bg,
                }}
                whileHover={{
                  zIndex: 30,
                  border: 'var(--color-border-hover)',
                  y: activeTheme.id != preset.id ? -2 : 0
                }}
                transition={{
                  duration: 0.1,
                  type: 'spring'
                }}
              >

                {activeTheme.id === preset.id && (
                  <YesOrNoBadge></YesOrNoBadge>
                )}

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
              </motion.button>
            );
          })}
        </div>
      </ComponentStackLayer>
    );
  }



  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-4">

        {/* 提示信息 */}
        <div className="px-3 py-2 rounded-(--radius-sm) bg-[var(--color-surface)] flex items-center">
          <p className="text-sm text-[var(--color-text-secondary)] flex items-start items-center gap-3">
            <span className="text-base">💡</span>
            <span>
              {t(
                'theme.terminal.tip',
                '点击主题卡片即可应用。再次点击可恢复默认主题。所有设置会自动保存。'
              )}
            </span>
          </p>
        </div>

        {theme_presets.map((preset) => {

          return (
            <motion.div
              key={preset.id}
              onClick={() => handleSelect(preset)}
              className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300`}
            >
              {/* 预览窗口 */}
              <div className={`p-5`}>
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
                    <span className="text-[var(--color-text-primary)]">WeCraft! Launcher</span>
                    <span className="text-[var(--color-primary)]">--version</span>
                  </div>
                  <div className="text-[var(--color-success)]">
                    ✓ v0.2.0 ready
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--color-text-tertiary)]">$</span>
                    <span className="terminal-cursor" />
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
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default TerminalThemePreview;
