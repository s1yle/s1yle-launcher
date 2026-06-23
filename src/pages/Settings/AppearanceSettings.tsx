import { UIMode, useUIModeStore } from '../../stores/uiModeStore';
import TerminalThemePreview from '../../components/common/TerminalThemePreview';
import { Toggle, LoadingSurface, Reveal, Page, PageSection } from '../../components/common';
import { SettingsPanel } from '@/components/common/SettingsPanel/SettingPanel';
import { useState, useCallback, useRef, useMemo } from 'react';
import DropDown from '@/components/common/DropDown';
import { fontScaleConfig } from '@/stores/fontStore';
import { useBackgroundStore } from '@/stores/backgroundStore';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import type { BackgroundType } from '@/config/types';
import { Slider } from '@/components/common/Slider';
import { useLoadingStore } from '@/stores/loadingStore';
import useFontStore from '@/stores/fontStore';
import { SystemFont } from '@/api';

const LOADING_VARIANT_OPTIONS = [
  { id: 'spinner', label: '旋转动画' },
  { id: 'progress', label: '进度条' },
  { id: 'skeleton', label: '骨架屏' },
  { id: 'topbar', label: '顶部进度条' },
];

const SPINNER_STYLE_OPTIONS = [
  { id: 'ring', label: '圆环' },
  { id: 'dots', label: '三点' },
  { id: 'pulse', label: '脉冲' },
  { id: 'bars', label: '柱状' },
];

const SKELETON_STYLE_OPTIONS = [
  { id: 'shimmer', label: '流光' },
  { id: 'pulse', label: '脉冲' },
  { id: 'static', label: '静态' },
];

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

const ApearanceSettings = () => {
  const { mode: uiMode, setMode: setUIMode, animation, setAnimation } = useUIModeStore();
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

  const handleAnimationSetting = () => {
    setAnimation({ enabled: !animation.enabled });
  }

  const handleFontScaleSelect = (option: { id: string; label: string }) => {
    const value = fontScaleConfig.fromId(option.id);
    setFontScale(value);
  }

  const handleLoadingVariantSelect = (option: { id: string; label: string }) => {
    const val = option.id as 'spinner' | 'progress' | 'skeleton' | 'topbar';
    setAnimation({ loadingVariant: val });
    useLoadingStore.getState().setConfig({ variant: val });
  }

  const handleSpinnerStyleSelect = (option: { id: string; label: string }) => {
    const val = option.id as 'ring' | 'dots' | 'pulse' | 'bars';
    setAnimation({ spinnerStyle: val });
    useLoadingStore.getState().setConfig({ spinnerStyle: val });
  }

  const handleSkeletonStyleSelect = (option: { id: string; label: string }) => {
    const val = option.id as 'shimmer' | 'pulse' | 'static';
    setAnimation({ skeletonStyle: val });
    useLoadingStore.getState().setConfig({ skeletonStyle: val });
  }

  const handleGlobalTopbarChange = (val: boolean) => {
    setAnimation({ globalTopbar: val });
    useLoadingStore.getState().setConfig({ globalTopbar: val });
  }

  const handleFontSelect = (option: { id: string, label: string }) => {
    let font: SystemFont = {
      name: option.id,
    }

    setFont(font);
  }

  const [demoActive, setDemoActive] = useState<string | null>(null);
  const demoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDemo = useCallback((variant: string) => {
    if (demoRef.current) clearTimeout(demoRef.current);
    const store = useLoadingStore.getState();
    store.unregister('demo:loading');
    store.register('demo:loading', { variant: variant as any, message: '' });
    setDemoActive(variant);
    demoRef.current = setTimeout(() => {
      store.done('demo:loading');
      setDemoActive(null);
    }, 2000);
  }, []);

  const stopDemo = useCallback(() => {
    if (demoRef.current) clearTimeout(demoRef.current);
    useLoadingStore.getState().done('demo:loading');
    setDemoActive(null);
  }, []);

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
      const selected = await invoke<string | null>('select_background_image');
      if (selected) {
        const assetUrl = convertFileSrc(selected);
        setBackground({ imagePath: assetUrl });
      }
    } catch {
      // user cancelled
    }
  }

  const currentTypeOption = BACKGROUND_TYPE_OPTIONS.find((o) => o.id === config.type);
  const currentFitOption = IMAGE_FIT_OPTIONS.find((o) => o.id === (config.imageFit || 'cover'));

  return (
    <Page className="p-6 max-w-5xl mx-auto">
      <PageSection>
        <SettingsPanel label="布局">
          <Toggle
            checked={uiMode == UIMode.CLASSIC}
            onChange={(enabled) => setUIMode(enabled ? UIMode.CLASSIC : UIMode.ISLAND)}
            label='经典模式(classic)'
            disabled={false}
          />

          <Toggle
            checked={animation.enabled}
            onChange={handleAnimationSetting}
            label='开启页面动画'
            disabled={false}
          />

          {/* TODO: 实现dropdown的 animateFromOrigin 开关 */}
          <SettingsPanel.Item>
            <SettingsPanel.DropDown
              label='字体'
              options={fontOptions}
              value={fontOptions.find((f) => f.id == font?.name)}
              onSelect={handleFontSelect}
              showSearch
              searchPlaceholder='请搜索'
            />
          </SettingsPanel.Item>

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
        </SettingsPanel>
      </PageSection>

      <PageSection>
        <SettingsPanel label="加载动画">
          <SettingsPanel.Item>
            <SettingsPanel.DropDown
              label="动画类型"
              options={LOADING_VARIANT_OPTIONS}
              value={LOADING_VARIANT_OPTIONS.find((o) => o.id === animation.loadingVariant)}
              onSelect={handleLoadingVariantSelect}
            />
          </SettingsPanel.Item>

          {animation.loadingVariant === 'spinner' && (
            <SettingsPanel.Item>
              <SettingsPanel.DropDown
                label="Spinner 风格"
                options={SPINNER_STYLE_OPTIONS}
                value={SPINNER_STYLE_OPTIONS.find((o) => o.id === animation.spinnerStyle)}
                onSelect={handleSpinnerStyleSelect}
              />
            </SettingsPanel.Item>
          )}

          {animation.loadingVariant === 'skeleton' && (
            <SettingsPanel.Item>
              <SettingsPanel.DropDown
                label="骨架屏风格"
                options={SKELETON_STYLE_OPTIONS}
                value={SKELETON_STYLE_OPTIONS.find((o) => o.id === animation.skeletonStyle)}
                onSelect={handleSkeletonStyleSelect}
              />
            </SettingsPanel.Item>
          )}

          <Toggle
            checked={animation.globalTopbar}
            onChange={handleGlobalTopbarChange}
            label="全局顶部进度条"
          />

          <SettingsPanel.Item noPadding>
            <div className="border-t border-[var(--color-border)] px-3 py-3">
              <span className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                加载动画演示
              </span>
              <div className="flex gap-2 mb-2">
                {LOADING_VARIANT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => triggerDemo(opt.id)}
                    className="px-3 py-1 text-xs rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={stopDemo}
                  className="px-3 py-1 text-xs rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  停止
                </button>
              </div>
              <div className="rounded-md border border-[var(--color-border)] min-h-[80px] overflow-hidden bg-[var(--color-bg-secondary)]">
                {demoActive ? (
                  <LoadingSurface loadingKey="demo:loading" skeleton="list" skeletonCount={3}>
                    <div className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">
                      真实内容区域
                    </div>
                  </LoadingSurface>
                ) : (
                  <div className="flex items-center justify-center h-20 text-xs text-[var(--color-text-disabled)]">
                    点击上方按钮触发加载演示
                  </div>
                )}
              </div>
            </div>
          </SettingsPanel.Item>
        </SettingsPanel>
      </PageSection>

      <PageSection>
        <Reveal direction="up" distance={20} duration={0.5}>
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

      <Reveal direction="up" distance={20} duration={0.5} delay={0.1}>
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
                  <div className="w-6/12 h-80 rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <img
                      src={config.imagePath}
                      alt="背景预览"
                      className="w-full h-full object-fill"
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

export default ApearanceSettings;
