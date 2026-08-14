import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteParams } from '@/router/routeParams';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, PageSection } from '@/components/common';
import {
  Box,
  Check,
  ChevronDown,
  Download,
  Flame,
  Gamepad2,
  Hexagon,
  Loader2,
  RefreshCw,
  Sun,
  Zap,
} from 'lucide-react';
import {
  download,
  getFabricVersions,
  getForgeVersions,
  getNeoForgeVersions,
  getOptifineVersions,
  ModLoaderType,
  type ModLoaderVersionItem,
} from '@/helper/rustInvoke';
import { useNotification } from '@/components/common';
import { useDownloadStore } from '../../stores/downloadStore';
import { DURATION, EASING } from '@/utils/animations';
import { refreshAll } from '../../stores/refreshStore';
import { useNavStore } from '../../stores/navStore';
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

/** 版本详情与安装页面 - 配置实例、选择加载器并开始下载 */
const VersionDetailWithInstall: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { versionId } = useRouteParams();

  const { error: notifyError, info } = useNotification();
  const startDownloadProgress = useDownloadStore(s => s.startDownloadProgress);
  const errorDownloadProgress = useDownloadStore(s => s.errorDownloadProgress);
  const setCurrentPath = useNavStore(s => s.setCurrentPath);

  const [gameName, setInstanceName] = useState('');
  const [expanded, setExpanded] = useState<LoaderKey | null>(null);
  const [selected, setSelected] = useState<{ type: ModLoaderType | null; version: string | null }>({ type: null, version: null });
  const [loaderState, setLoaderState] = useState<Record<LoaderKey, { loading: boolean; error: string | null; versions: ModLoaderVersionItem[] }>>({
    vanilla: { loading: false, error: null, versions: [] },
    forge: { loading: false, error: null, versions: [] },
    neoforge: { loading: false, error: null, versions: [] },
    fabric: { loading: false, error: null, versions: [] },
    optifine: { loading: false, error: null, versions: [] },
  });
  const [starting, setStarting] = useState(false);
  const loadedRef = useRef<Record<LoaderKey, boolean>>({ vanilla: true, forge: false, neoforge: false, fabric: false, optifine: false });

  useEffect(() => {
    if (versionId) {
      setInstanceName(versionId);
    }
  }, [versionId]);

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

  const handleStart = useCallback(async () => {
    if (starting) return;
    if (!versionId) return;
    if (!gameName.trim()) {
      notifyError(t('download.install.installFailed'), t('download.install.gameNamePlaceholder'));
      return;
    }

    setStarting(true);
    startDownloadProgress(versionId);
    // info(
      // t('download.install.downloadStarted'),
      // t('download.install.downloadStartedMsg', { version: versionId })
    // );

    // navigate('/download/game');
    // setCurrentPath('/download/game');

    try {
      await download({
        game_name: gameName.trim(),
        version_id: versionId,
        loader_type: selected.type ?? ModLoaderType.Vanilla,
        loader_version: selected.version,
        target_existing_game: null,
      });
      await refreshAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errorDownloadProgress(versionId, msg);
      setStarting(false);
      notifyError(t('download.install.downloadFailed'), msg);
    }
  }, [versionId, gameName, selected, starting, startDownloadProgress, errorDownloadProgress, info, notifyError, navigate, setCurrentPath, t]);

  return (
    <Page className="h-full flex flex-col overflow-hidden relative">
      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5 pb-10">
          {/* 实例配置 */}
          <PageSection className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {t('download.install.gameName')}
              </h2>
            </div>
            <input
              type="text"
              value={gameName}
              onChange={e => setInstanceName(e.target.value)}
              placeholder={versionId ?? t('download.install.gameNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </PageSection>

          {/* 模组加载器 */}
          <PageSection className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
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
                            transition={{
                              opacity: { duration: DURATION.DROPDOWN, ease: EASING.OUT_FLUENT },
                              height: { duration: DURATION.DROPDOWN, ease: EASING.OUT_FLUENT },
                            }}
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
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${active
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
          </PageSection>
        </div>
      </div>

      {/* 底部下载按钮 */}
      <motion.button
        onClick={handleStart}
        disabled={starting}
        className="relative overflow-hidden py-2.5
          flex items-center justify-center gap-3 font-light
          cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
          bg-(--color-surface) hover:bg-(--color-surface-hover)"
      >
        {starting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Download className="w-6 h-6" />
        )}
        {starting ? t('download.install.installing') : t('download.install.installButton')}
      </motion.button>
    </Page>
  );
};

export default VersionDetailWithInstall;
