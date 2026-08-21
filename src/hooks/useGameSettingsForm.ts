import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getMemoryUsage,
  getDisplayResolutions,
  selectJavaPath,
  scanJavaInstallations,
  type GameSettings,
  type JavaInstallation,
} from '@/helper/rustInvoke';
import { DropDownOption } from '@/components/common/DropDown';
import { getErrorMessage } from '@/utils/errorUtils';
import { usePolling } from './usePolling';
import { useRouteData } from '@/router/routeData';

/** 格式化内存大小：>= 1024 MB 显示为 GB，否则显示 MB */
export function formatMemory(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

/** 解析 "WxH" 分辨率的像素面积，用于升序排序 */
function resolutionArea(res: string): number {
  const [w, h] = res.split('x').map(Number);
  return (Number.isFinite(w) ? w : 0) * (Number.isFinite(h) ? h : 0);
}

/** useGameSettingsForm 的配置选项 */
interface UseGameSettingsFormOptions {
  /** 当前正在编辑的设置对象（独立设置页为 gameSettings/globalSettings 二选一） */
  settings: GameSettings;
  /** 更新当前编辑设置的单个字段 */
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  /** 自动分配内存开关状态 */
  autoMemory: boolean;
  /** 设置自动分配内存开关（由页面持有，加载时需从配置同步） */
  setAutoMemory: (v: boolean) => void;
  /** 选择 Java 路径失败时的提示回调 */
  onJavaSelectFailed: (msg: string) => void;
}

/**
 * 游戏设置表单 hook - 合并「独立设置」与「全局设置」页面的共享逻辑：
 * 内存轮询与分配计算、显示器分辨率加载与选项、Java 安装扫描与选择。
 *
 * 页面差异（设置对象的加载/保存、独立设置开关分支）仍由各页面自行处理，
 * 通过 `settings` / `updateSetting` 注入，保证复用且不破坏页面特有行为。
 */
export function useGameSettingsForm({
  settings,
  updateSetting,
  autoMemory,
  setAutoMemory,
  onJavaSelectFailed,
}: UseGameSettingsFormOptions) {
  const { t } = useTranslation();
  const [systemMemory, setSystemMemory] = useState(0);
  const [usedMemory, setUsedMemory] = useState(0);
  const [javaPaths, setJavaPaths] = useState<JavaInstallation[]>([]);
  const [displayResolutions, setDisplayResolutions] = useState<string[]>([]);
  const routeData = useRouteData<{ javas?: JavaInstallation[] }>();

  // 扫描系统中已安装的 Java：优先取路由 loader 提供的 javas，否则回退自行扫描
  useEffect(() => {
    if (routeData?.javas?.length) {
      setJavaPaths(routeData.javas);
    } else {
      scanJavaInstallations()
        .then(setJavaPaths)
        .catch(() => setJavaPaths([]));
    }
  }, [routeData?.javas]);

  // 轮询真实内存使用（1s），数据来自 Rust get_memory_usage
  usePolling(async () => {
    try {
      const [used, total] = await getMemoryUsage();
      if (total === 0) return;
      setUsedMemory(used);
      setSystemMemory(total);
    } catch (e) {
      console.error('[useGameSettingsForm] memory refresh failed:', e);
    }
  }, { interval: 1000 });

  // 加载显示器真实分辨率（失败静默，保留预设兜底）
  useEffect(() => {
    getDisplayResolutions().then(setDisplayResolutions).catch(console.error);
  }, []);

  // PCL 语义：可用 = 总 - 已用；游戏分配 part 与滑块同源（max_memory = -Xmx，启动实际分配值），
  // 自动分配时实时展示: 剩余空隙 = total - (已用 + 游戏分配)
  const availMemory = Math.max(0, systemMemory - usedMemory);
  // HMCL 风格推荐值：可用内存 - 2G（系统/浏览器预留），下限 1G，上限不超总内存
  const recommendedMemory = Math.max(1024, Math.min(availMemory - 2048, systemMemory || 16384));
  const gameMemory = autoMemory
    ? Math.min(recommendedMemory, availMemory)
    : Math.min(settings.max_memory || 2048, availMemory);
  const gapMemory = Math.max(0, availMemory - gameMemory);

  // 内存自动分配开关：把推荐值真正写入设置（防抖落盘），保证启动时使用的是实际分配值
  const handleAutoMemoryChange = (checked: boolean) => {
    setAutoMemory(checked);
    if (checked) {
      updateSetting('min_memory', 1024);
      updateSetting('max_memory', recommendedMemory);
    } else {
      updateSetting('min_memory', 1024);
      updateSetting('max_memory', 2048);
    }
  };

  // 分辨率选项：真实显示器模式 + 常用预设兜底（去重，按面积升序排列）
  const resolutionOptions: DropDownOption[] = useMemo(() => {
    const presets = ['854x480', '1280x720', '1920x1080'];
    const merged = [...new Set([...displayResolutions, ...presets])];
    return merged
      .map((res) => ({ id: res, label: res }))
      .sort((a, b) => resolutionArea(a.id) - resolutionArea(b.id));
  }, [displayResolutions]);

  const currentResolution = settings.width && settings.height
    ? `${settings.width}x${settings.height}`
    : '1280x720';

  // 当前值不在选项内（自定义分辨率）时动态并入，并按面积插入排序位置
  const resolutionOptionsWithCurrent = useMemo(() => {
    if (resolutionOptions.some((o) => o.id === currentResolution)) {
      return resolutionOptions;
    }
    const current: DropDownOption = { id: currentResolution, label: currentResolution };
    return [...resolutionOptions, current].sort((a, b) => resolutionArea(a.id) - resolutionArea(b.id));
  }, [resolutionOptions, currentResolution]);

  // DropDown 选项：自动选择 + 已扫描 Java + 当前自定义路径兜底
  const javaOptions: DropDownOption[] = [
    { id: 'auto', label: t('settings.java.auto', '自动选择合适的 Java') },
    ...javaPaths.map(java => ({
      id: java.path,
      label: `${java.version} (${java.vendor}${java.is_jdk ? ', JDK' : ''}, ${java.is_64bit ? '64位' : '32位'})`,
    })),
    ...(settings.java_path && !javaPaths.some(j => j.path === settings.java_path)
      ? [{ id: settings.java_path, label: settings.java_path }]
      : []),
  ];

  const selectedJavaOption = javaOptions.find(o => o.id === (settings.java_path || 'auto')) ?? javaOptions[0];

  const handleJavaSelect = (option: DropDownOption) => {
    if (option.id === 'auto') {
      updateSetting('java_path', undefined);
    } else {
      updateSetting('java_path', option.id);
    }
  };

  const handleBrowseJava = async () => {
    try {
      const path = await selectJavaPath();
      if (path) {
        updateSetting('java_path', path);
        const versionMatch = path.match(/java[-_]?(\d+)/i);
        const version = versionMatch ? `Java ${versionMatch[1]}` : 'Unknown';
        setJavaPaths(prev => [...prev, { path, version, vendor: '手动添加', is_jdk: true, major_version: versionMatch ? parseInt(versionMatch[1], 10) : 0, is_64bit: true }]);
      }
    } catch (e) {
      onJavaSelectFailed(getErrorMessage(e));
    }
  };

  return {
    systemMemory,
    usedMemory,
    availMemory,
    recommendedMemory,
    gameMemory,
    gapMemory,
    handleAutoMemoryChange,
    resolutionOptions,
    currentResolution,
    resolutionOptionsWithCurrent,
    javaOptions,
    selectedJavaOption,
    handleJavaSelect,
    handleBrowseJava,
  };
}
