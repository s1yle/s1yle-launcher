import { useState, useEffect, useCallback,  useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteParams } from '@/router/routeParams';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Box,
  Check,
  ChevronDown,
  Download,
  Flame,
  Gamepad2,
  HardDrive,
  Hexagon,
  Loader2,
  RefreshCw,
  Sun,
  Zap,
} from 'lucide-react';
import {
  downloadAndDeploy,
  getFabricVersions,
  getForgeVersions,
  getNeoForgeVersions,
  getOptifineVersions,
  getVersionDownloadManifest,
  getDiskFreeSpace,
  ModLoaderType,
  type ModLoaderVersionItem,
} from '@/helper/rustInvoke';
import { useNotification } from '@/components/common';
import { useDownloadStore } from '../../stores/downloadStore';
import { refreshAll } from '../../stores/refreshStore';
import { useUIModeStore, UIMode } from '../../stores/uiModeStore';
import { useNavStore } from '../../stores/navStore';
import { getJavaRequirement } from '../../utils/modloaderCompat';

type LoaderKey = 'vanilla' | 'forge' | 'neoforge' | 'fabric' | 'optifine';

interface LoaderEntry {
  key: LoaderKey;
  type: ModLoaderType | null;
  icon: React.ComponentType<{ className?: string }>;
}

const LOADER_LIST: LoaderEntry[] = [
  { key: 'vanilla', type: null, icon: Gamepad2 },
  { key: 'forge', type: ModLoaderType.Forge, icon: Flame },
  { key: 'neoforge', type: ModLoaderType.NeoForge, icon: Hexagon },
  { key: 'fabric', type: ModLoaderType.Fabric, icon: Zap },
  { key: 'optifine', type: ModLoaderType.OptiFine, icon: Sun },
];

const fetchLoaderVersions = async (
  key: LoaderKey,
  mcVersion: string
): Promise<ModLoaderVersionItem[]> => {
  switch (key) {
    case 'forge':
      return (await getForgeVersions(mcVersion)).versions;
    case 'neoforge':
      return (await getNeoForgeVersions(mcVersion)).versions;
    case 'fabric':
      return (await getFabricVersions(mcVersion)).versions;
    case 'optifine':
      return (await getOptifineVersions(mcVersion)).versions;
    default:
      return [];
  }
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '--';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = '';
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
};

/** 版本详情与安装页面 - 配置实例、选择加载器并开始下载 */
const VersionDetailWithInstall: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { versionId } = useRouteParams();

  const { error: notifyError, info } = useNotification();
  const startDownloadProgress = useDownloadStore(s => s.startDownloadProgress);
  const errorDownloadProgress = useDownloadStore(s => s.errorDownloadProgress);
  const basePath = useDownloadStore(s => s.basePath);
  const uiMode = useUIModeStore(s => s.mode);
  const setCurrentPath = useNavStore(s => s.setCurrentPath);

  const [instanceName, setInstanceName] = useState('');
  const [expanded, setExpanded] = useState<LoaderKey | null>(null);
  const [selected, setSelected] = useState<{ type: ModLoaderType | null; version: string | null }>({ type: null, version: null });
  const [loaderState, setLoaderState] = useState<Record<LoaderKey, { loading: boolean; error: string | null; versions: ModLoaderVersionItem[] }>>({
    vanilla: { loading: false, error: null, versions: [] },
    forge: { loading: false, error: null, versions: [] },
    neoforge: { loading: false, error: null, versions: [] },
    fabric: { loading: false, error: null, versions: [] },
    optifine: { loading: false, error: null, versions: [] },
  });
  const [estSize, setEstSize] = useState<number | null>(null);
  const [freeSpace, setFreeSpace] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const loadedRef = useRef<Record<LoaderKey, boolean>>({ vanilla: true, forge: false, neoforge: false, fabric: false, optifine: false });

  useEffect(() => {
    if (versionId) {
      setInstanceName(versionId);
    }
  }, [versionId]);

  useEffect(() => {
    if (!versionId) return;

    let cancelled = false;
    const loadStorageInfo = async () => {
      try {
        const manifest = await getVersionDownloadManifest(versionId);
        if (cancelled) return;
        const total = [
          manifest.client_jar?.size ?? 0,
          ...manifest.libraries.map(f => f.size ?? 0),
          ...manifest.assets.map(f => f.size ?? 0),
          ...manifest.natives.map(f => f.size ?? 0),
          manifest.asset_index?.size ?? 0,
        ].reduce((a, b) => a + b, 0);
        setEstSize(total);
      } catch {
        if (!cancelled) setEstSize(-1);
      }
    };

    const loadFreeSpace = async () => {
      try {
        const free = await getDiskFreeSpace(basePath || '/');
        if (!cancelled) setFreeSpace(free);
      } catch {
        if (!cancelled) setFreeSpace(-1);
      }
    };

    loadStorageInfo();
    loadFreeSpace();
    return () => { cancelled = true; };
  }, [versionId, basePath]);

  const toggleLoader = useCallback((key: LoaderKey) => {
    if (key === 'vanilla') {
      setSelected({ type: null, version: null });
      return;
    }
    setExpanded(prev => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    if (!expanded || !versionId || loadedRef.current[expanded]) return;
    loadedRef.current[expanded] = true;
    setLoaderState(prev => ({ ...prev, [expanded]: { loading: true, error: null, versions: [] } }));

    fetchLoaderVersions(expanded, versionId)
      .then(versions => {
        setLoaderState(prev => ({ ...prev, [expanded]: { loading: false, error: null, versions } }));
      })
      .catch(e => {
        setLoaderState(prev => ({ ...prev, [expanded]: { loading: false, error: e instanceof Error ? e.message : String(e), versions: [] } }));
      });
  }, [expanded, versionId]);

  const retryLoader = useCallback((key: LoaderKey) => {
    loadedRef.current[key] = false;
    setExpanded(null);
    setTimeout(() => setExpanded(key), 0);
  }, []);

  const handleSelectVersion = useCallback((key: LoaderKey, version: string) => {
    const entry = LOADER_LIST.find(l => l.key === key);
    if (!entry) return;
    setSelected({ type: entry.type, version });
    setExpanded(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/download/game');
    setCurrentPath('/download/game');
  }, [navigate, setCurrentPath]);

  const handleStart = useCallback(async () => {
    if (starting) return;
    if (!versionId) return;
    if (!instanceName.trim()) {
      notifyError(t('download.install.installFailed'), t('download.install.instanceNamePlaceholder'));
      return;
    }

    setStarting(true);
    startDownloadProgress(versionId);
    info(
      t('download.install.downloadStarted'),
      t('download.install.downloadStartedMsg', { version: versionId })
    );

    navigate('/download/game');
    setCurrentPath('/download/game');

    try {
      await downloadAndDeploy({
        instance_name: instanceName.trim(),
        version_id: versionId,
        loader_type: selected.type ?? ModLoaderType.Vanilla,
        loader_version: selected.version,
        target_existing_instance: null,
      });
      await refreshAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errorDownloadProgress(versionId, msg);
      notifyError(t('download.install.downloadFailed'), msg);
    }
  }, [versionId, instanceName, selected, starting, startDownloadProgress, errorDownloadProgress, info, notifyError, navigate, setCurrentPath, t]);

  const isIsland = uiMode === UIMode.ISLAND;
  const javaReq = versionId ? getJavaRequirement(versionId) : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg-primary)] relative">
      {/* 顶部拖曳栏 */}
      <div
        className="h-12 flex-shrink-0 flex items-center gap-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-solid)]"
        data-tauri-drag-region="true"
      >
        {isIsland && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="p-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-active)] transition-colors cursor-pointer"
            title={t('download.install.back')}
            data-tauri-drag-region="false"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
        <span className="text-sm font-semibold text-[var(--color-text-primary)] select-none">
          {t('download.install.title')}
        </span>
        {versionId && (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
            {versionId}
          </span>
        )}
        <div className="flex-1" data-tauri-drag-region="true" />
        {javaReq !== null && (
          <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:block select-none" data-tauri-drag-region="true">
            {t('download.install.compatibility.javaVersionRequired', { version: javaReq })}
          </span>
        )}
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5 pb-10">
          {/* 实例配置 */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {t('download.install.instanceName')}
              </h2>
            </div>
            <input
              type="text"
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              placeholder={versionId ?? t('download.install.instanceNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </section>

          {/* 模组加载器 */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="flex items-center gap-2 p-5 pb-3">
              <Box className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {t('download.install.modLoaders')}
              </h2>
            </div>
            <p className="px-5 pb-4 text-xs text-[var(--color-text-tertiary)]">
              {t('download.install.modLoadersDesc')}
            </p>

            <div className="divide-y divide-[var(--color-border)]">
              {LOADER_LIST.map(entry => {
                const isExpanded = expanded === entry.key;
                const state = loaderState[entry.key];
                const isSelected = entry.type === selected.type && (entry.type === null ? selected.version === null : selected.version !== null);
                const Icon = entry.icon;

                return (
                  <div key={entry.key}>
                    <button
                      onClick={() => toggleLoader(entry.key)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                    >
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]' : 'bg-[var(--color-surface-active)] text-[var(--color-text-secondary)]'}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                          {entry.key === 'vanilla' ? t('download.install.loaderVanilla') : t(`download.install.cards.${entry.key}`)}
                        </span>
                        <span className="block text-xs text-[var(--color-text-tertiary)]">
                          {entry.key === 'vanilla'
                            ? t('download.install.loaderVanillaDesc')
                            : isSelected && selected.version
                              ? `${t('download.install.loaderSelected')}: ${selected.version}`
                              : state.versions.length > 0
                                ? t('download.install.loaderVersionCount', { count: state.versions.length })
                                : ''}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-success-bg)] text-[var(--color-success)]">
                          <Check className="w-3.5 h-3.5" />
                          {t('download.install.loaderSelected')}
                        </span>
                      )}
                      {entry.key !== 'vanilla' && (
                        <ChevronDown className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {entry.key !== 'vanilla' && (
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4">
                              {state.loading ? (
                                <div className="flex items-center gap-2 py-3 text-sm text-[var(--color-text-tertiary)]">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t('common.loading')}
                                </div>
                              ) : state.error ? (
                                <div className="flex items-center gap-2 py-3 text-sm text-[var(--color-error)]">
                                  <span>{t('download.install.loaderFetchFailed')}</span>
                                  <button
                                    onClick={() => retryLoader(entry.key)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    {t('download.retry', '重试')}
                                  </button>
                                </div>
                              ) : state.versions.length === 0 ? (
                                <p className="py-3 text-sm text-[var(--color-text-tertiary)]">
                                  {t('download.install.loaderUnsupported', { loader: t(`download.install.cards.${entry.key}`) })}
                                </p>
                              ) : (
                                <div className="max-h-56 overflow-y-auto pr-1 space-y-1">
                                  {state.versions.map(item => {
                                    const active = isSelected && selected.version === item.version;
                                    return (
                                      <button
                                        key={item.version}
                                        onClick={() => handleSelectVersion(entry.key, item.version)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${
                                          active
                                            ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary)] text-[var(--color-primary)]'
                                            : 'bg-[var(--color-surface-hover)] border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)]'
                                        }`}
                                      >
                                        <span className="font-mono truncate">{item.version}</span>
                                        {item.stable && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0 bg-[var(--color-success-bg)] text-[var(--color-success)]">
                                            {t('download.install.compatibility.testCompatible', 'stable')}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* 底部下载按钮 */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md">
        <motion.button
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 0.15 }}
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.975 }}
          onClick={handleStart}
          disabled={starting}
          className="relative w-full overflow-hidden py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg text-white cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 50%, var(--color-primary) 100%)',
            backgroundSize: '200% 100%',
            boxShadow: '0 8px 28px var(--color-primary-20)',
          }}
        >
          <motion.span
            className="absolute inset-y-0 w-1/3 bg-white/20 blur-md"
            style={{ left: '-40%' }}
            animate={{ left: ['-40%', '120%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
          />
          {starting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Download className="w-6 h-6" />
            </motion.span>
          )}
          {starting ? t('download.install.installing') : t('download.install.installButton')}
        </motion.button>
      </div>

      {/* 存储信息 - 右下角 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="fixed bottom-[92px] right-4 z-30 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md shadow-xl px-4 py-3 min-w-[180px]"
      >
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {t('download.install.storage')}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--color-text-tertiary)]">{t('download.install.estimatedSize')}</span>
            <span className="font-mono text-[var(--color-text-primary)]">
              {estSize === null ? t('download.install.calculating') : estSize < 0 ? t('download.install.unknown') : formatBytes(estSize)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--color-text-tertiary)]">{t('download.install.freeSpace')}</span>
            <span className={`font-mono ${freeSpace !== null && estSize !== null && freeSpace >= 0 && estSize >= 0 && freeSpace < estSize ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
              {freeSpace === null ? t('download.install.calculating') : freeSpace < 0 ? t('download.install.unknown') : formatBytes(freeSpace)}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VersionDetailWithInstall;
