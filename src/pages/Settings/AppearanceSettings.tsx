import { UIMode, useUIModeStore } from '../../stores/uiModeStore';
import TerminalThemePreview from '../../components/common/TerminalThemePreview';
import { Toggle, Reveal, Page, PageSection } from '../../components/common';
import { SettingsPanel } from '@/components/common/SettingsPanel/SettingPanel';
import { useState, useMemo } from 'react';
import DropDown from '@/components/common/DropDown';
import { fontScaleConfig } from '@/stores/fontStore';
import { useAccessibilityStore } from '@/stores/accessibilityStore';
import { useBackgroundStore } from '@/stores/backgroundStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { BackgroundType } from '@/config/types';
import { Slider } from '@/components/common/Slider';
import { useLoadingStore } from '@/stores/loadingStore';
import useFontStore from '@/stores/fontStore';
import { SystemFont } from '@/api';
import { selectBackgroundImage } from '@/helper/rustInvoke';
import { useAvatarStore } from '@/stores/avatarStore';

const BACKGROUND_TYPE_OPTIONS = [
  { id: 'none', label: '无' },
  { id: 'color', label: '纯色' },
  { id: 'gradient', label: '渐变' },
  { id: 'image', label: '图片' },
];

const IMAGE_FIT_OPTIONS = [
  { id: 'cover', label: '覆盖' },
  { id: 'contain', label: '适应' },
  { id: 'fill', label: '填充' },
  { id: 'tile', label: '平铺' },
];

const GRADIENT_PRESETS = [
  { id: 'sunset', label: '日落', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'ocean', label: '海洋', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'neon', label: '霓虹', value: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { id: 'aurora', label: '极光', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'night', label: '暗夜', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
];

/** 外观设置页面 - 布局模式、字体、加载动画、主题、背景 */
const AppearanceSettings = () => {
  const { mode: uiMode, setMode: setUIMode, animation, setAnimation } = useUIModeStore();
  const loadingConfig = useLoadingStore((s) => s.config);
  const [isCompat, setIsCompat] = useState(true)

  // 字体store
  const fontScale = useFontStore((s) => s.fontScale);
  const setFontScale = useFontStore((s) => s.setFontScale);
  const fonts = useFontStore((s) => s.fonts);
  const font = useFontStore((s) => s.font);
  const setFont = useFontStore((s) => s.setFont);

  const fontOptions = useMemo(() => {
    return (fonts ?? []).map(f => ({ id: f.name, label: f.name }));
  }, [fonts]);

  // 背景store
  const { config, setBackground, resetBackground } = useBackgroundStore();

  // 无障碍辅助
  const photosensitive = useAccessibilityStore((s) => s.photosensitive);
  const setPhotosensitive = useAccessibilityStore((s) => s.setPhotosensitive);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const setHighContrast = useAccessibilityStore((s) => s.setHighContrast);

  const handleAnimationSetting = () => {
    setAnimation({ enabled: !animation.enabled });
  }

  const handleFontScaleSelect = (option: { id: string; label: string }) => {
    const value = fontScaleConfig.fromId(option.id);
    setFontScale(value);
  }

  const handleGlobalTopbarChange = (val: boolean) => {
    useLoadingStore.getState().setConfig({ globalTopbar: val });
  }

  const avatarMode = useAvatarStore((s) => s.mode);
  const setAvatarMode = useAvatarStore((s) => s.setMode);

  const AVATAR_MODE_OPTIONS = [
    { id: 'flat', label: '平面 2D' },
    { id: 'isometric', label: '立体 3D' },
  ];

  const handleAvatarModeSelect = (option: { id: string; label: string }) => {
    setAvatarMode(option.id as 'flat' | 'isometric');
  };

  const handleFontSelect = (option: { id: string, label: string }) => {
    let font: SystemFont = {
      name: option.id,
    }

    setFont(font);
  }

  const handleTypeSelect = (option: { id: string; label: string }) => {
    setBackground({ type: option.id as BackgroundType });
  }

  const handleFitSelect = (option: { id: string; label: string }) => {
    setBackground({ imageFit: option.id as 'cover' | 'contain' | 'fill' | 'tile' });
  }

  const handleGradientPreset = (value: string) => {
    setBackground({ gradient: value });
  }

  const handleSelectImage = async () => {
    try {
      const selected = await selectBackgroundImage();

      if (selected) {
        const assetUrl = `${convertFileSrc(selected)}?v=${Date.now()}`;
        setBackground({ imagePath: assetUrl });
      }
    } catch {
      // user cancelled
    }
  }

  const currentTypeOption = BACKGROUND_TYPE_OPTIONS.find((o) => o.id === config.type);
  const currentFitOption = IMAGE_FIT_OPTIONS.find((o) => o.id === (config.imageFit || 'cover'));

  return (
    <Page className="overflow-y-auto p-6 max-w-5xl mx-auto">
      <PageSection>
        <SettingsPanel label="布局">
          <PageSection>
            <Toggle
              checked={uiMode == UIMode.CLASSIC}
              onChange={(enabled) => setUIMode(enabled ? UIMode.CLASSIC : UIMode.ISLAND)}
              label='经典模式(classic)'
              disabled={false}
            />
          </PageSection>


          <PageSection>
            <Toggle
              checked={animation.enabled}
              onChange={handleAnimationSetting}
              label="页面动画（需系统动画支持）"
              description="Windows 需开启系统动画设置（窗口内的动画控件和元素）"
              disabled={false}
            />
          </PageSection>

          <PageSection>

            <SettingsPanel.Item>
              <SettingsPanel.DropDown
                label='字体'
                options={fontOptions}
                value={fontOptions.find((f) => f.id == font?.name)}
                onSelect={handleFontSelect}
                showSearch
                searchPlaceholder='请搜索'
                animateFromOrigin
              />
            </SettingsPanel.Item>
          </PageSection>

          <PageSection>
            <SettingsPanel.Item>
              <SettingsPanel.DropDown
                label='字体大小'
                options={fontScaleConfig.options}
                value={fontScaleConfig.options.find(
                  o => o.id === fontScaleConfig.toId(fontScale)
                )}
                onSelect={handleFontScaleSelect}
              />
            </SettingsPanel.Item>
          </PageSection>

          <PageSection>
            <SettingsPanel.Item>
              <SettingsPanel.DropDown
                label='头像显示'
                options={AVATAR_MODE_OPTIONS}
                value={AVATAR_MODE_OPTIONS.find((o) => o.id === avatarMode)}
                onSelect={handleAvatarModeSelect}
              />
            </SettingsPanel.Item>
          </PageSection>
        </SettingsPanel>
      </PageSection>

      <PageSection>
        <SettingsPanel label="加载动画">
          <Toggle
            checked={loadingConfig.globalTopbar}
            onChange={handleGlobalTopbarChange}
            label="全局顶部进度条"
          />
        </SettingsPanel>
      </PageSection>

      <PageSection>
        <Reveal>
          <SettingsPanel label="主题">
            <SettingsPanel.Item shouldLoad={true} loadingKey='appearacne:theme'>
              <SettingsPanel.Sub label='终端主题'>
                <SettingsPanel.Toggle
                  checked={isCompat}
                  onChange={(enabled) => { setIsCompat(enabled) }}
                  label='简洁模式'
                />
                <TerminalThemePreview compact={isCompat} />
              </SettingsPanel.Sub>
            </SettingsPanel.Item>
          </SettingsPanel>
        </Reveal>
      </PageSection>

      <Reveal>
        <SettingsPanel label="无障碍">
            <Toggle
              checked={highContrast}
              onChange={setHighContrast}
              label="高对比度模式"
              description="独立于系统反转，提供更高对比度的界面"
              disabled={false}
              
            />

            <Toggle
              checked={photosensitive}
              onChange={setPhotosensitive}
              label="光敏模式"
              description="纯黑背景 + 无动画 + 高对比度文本，降低亮度与闪烁刺激"
              disabled={false}
            />
        </SettingsPanel>
      </Reveal>

      <Reveal>
        <SettingsPanel label="背景">
          <SettingsPanel.Item>
            <SettingsPanel.DropDown
              label="背景类型"
              options={BACKGROUND_TYPE_OPTIONS}
              value={currentTypeOption}
              onSelect={handleTypeSelect}
            />
          </SettingsPanel.Item>

          {config.type === 'color' && (
            <SettingsPanel.Item>
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-[var(--color-text-secondary)]">背景颜色</span>
                <input
                  type="color"
                  value={config.color || '#2c577e'}
                  onChange={(e) => setBackground({ color: e.target.value })}
                  className="w-10 h-10 rounded-md border border-[var(--color-border)] bg-transparent cursor-pointer"
                />
              </div>
            </SettingsPanel.Item>
          )}

          {config.type === 'gradient' && (
            <SettingsPanel.Item>
              <div className="px-1">
                <span className="text-sm text-[var(--color-text-secondary)] block mb-2">渐变预设</span>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleGradientPreset(preset.value)}
                      className={`w-14 h-14 rounded-lg border-2 transition-all ${config.gradient === preset.value
                        ? 'border-[var(--color-primary)] scale-110'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                        }`}
                      style={{ backgroundImage: preset.value }}
                      title={preset.label}
                    />
                  ))}
                </div>
                <div className="mt-3">
                  <span className="text-sm text-[var(--color-text-secondary)] block mb-1">自定义渐变</span>
                  <input
                    type="text"
                    value={config.gradient || ''}
                    onChange={(e) => setBackground({ gradient: e.target.value })}
                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-md outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </SettingsPanel.Item>
          )}

          {config.type === 'image' && (
            <SettingsPanel.Item>
              <div className="px-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">选择图片</span>
                  <button
                    onClick={handleSelectImage}
                    className="px-4 py-1.5 text-sm rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                  >
                    浏览...
                  </button>
                </div>
                {/* OPTIMIZE: 提取为通用缩略图组件 */}
                {config.imagePath && (
                  <div className="w-full max-w-64 min-w-40 rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <img
                      src={config.imagePath}
                      alt="背景预览"
                      className="w-full h-auto max-h-40 min-h-24 object-cover"
                    />
                  </div>
                )}
                <DropDown
                  options={IMAGE_FIT_OPTIONS}
                  value={currentFitOption}
                  onSelect={handleFitSelect}
                  buttonWidth="w-xs"
                />
              </div>
            </SettingsPanel.Item>
          )}

          {config.type !== 'none' && (
            <>
              <SettingsPanel.Item>
                <div className="px-1">
                  <Slider
                    label="透明度"
                    value={config.opacity}
                    min={0}
                    max={1}
                    step={0.01}
                    displayValue={`${Math.round(config.opacity * 100)}%`}
                    onChange={(v) => setBackground({ opacity: v })}
                  />
                </div>
              </SettingsPanel.Item>

              {config.type === 'image' && (
                <SettingsPanel.Item>
                  <div className="px-1">
                    <Slider
                      label="模糊"
                      value={config.blur}
                      min={0}
                      max={50}
                      step={1}
                      displayValue={`${config.blur}px`}
                      onChange={(v) => setBackground({ blur: v })}
                    />
                  </div>
                </SettingsPanel.Item>
              )}

              <SettingsPanel.Item>
                <div className="px-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">叠加色</span>
                    <input
                      type="color"
                      value={config.overlayColor}
                      onChange={(e) => setBackground({ overlayColor: e.target.value })}
                      className="w-8 h-8 rounded-md border border-[var(--color-border)] bg-transparent cursor-pointer"
                    />
                  </div>
                  <Slider
                    label="叠加强度"
                    value={config.overlayOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                    displayValue={`${Math.round(config.overlayOpacity * 100)}%`}
                    onChange={(v) => setBackground({ overlayOpacity: v })}
                  />
                </div>
              </SettingsPanel.Item>
            </>
          )}

          <SettingsPanel.Item>
            <div className="px-1">
              <button
                onClick={resetBackground}
                className="px-4 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors"
              >
                重置为默认
              </button>
            </div>
          </SettingsPanel.Item>
        </SettingsPanel>
      </Reveal>
    </Page>
  );
};

export default AppearanceSettings;
