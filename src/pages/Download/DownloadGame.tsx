import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useDownloadStore } from '../../stores/downloadStore';
import { GameVersion, openFolder, openUrl, getGameRoot } from '../../helper/rustInvoke';
import { VersionListItem, EmptyState, useNotification, VirtualList, Page, PageSection, Skeleton } from '../../components/common';
import DropDown from '@/components/common/DropDown';
import { useNavStore } from '../../stores/navStore';
import { getWikiUrl } from '../../utils/modloaderCompat';
import { VersionCategory, filterVersionsByCategory, countVersionsByCategory } from '../../utils/versionFilter';
import BottomBar from '@/components/common/BottomBar/BottomBar';
import { useShallow } from 'zustand/shallow';
import { DURATION, EASING } from '@/utils/animations';

const ITEM_HEIGHT = 72;

/** 游戏下载页面 - 浏览和下载 Minecraft 版本 */
const DownloadGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setCurrentPath = useNavStore((s) => s.setCurrentPath);
  const {
    manifest,
    installedVersions,
    completedVersions,
    loading,
    error,
  } = useDownloadStore(
    useShallow(s => ({
      manifest: s.manifest,
      installedVersions: s.installedVersions,
      completedVersions: s.completedVersions,
      loading: s.loading,
      error: s.error,
    }))
  );

  // 函数引用永不变化，单独取出不导致重渲染
  const loadManifest = useDownloadStore(s => s.loadManifest);
  const loadInstalledVersions = useDownloadStore(s => s.loadInstalledVersions);
  const [gamesPath, setGamesPath] = useState('');

  const { error: notifyError } = useNotification();

  const [filter, setFilter] = useState<VersionCategory>('release');
  const [searchQuery, setSearchQuery] = useState('');
  const [manifestLoading, setManifestLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchManifest = useCallback(async () => {
    setManifestLoading(true);
    try {
      await loadManifest();
    } catch {
    } finally {
      setManifestLoading(false);
    }
  }, [loadManifest]);

  const filterOptions = useMemo(() => {
    const counts = countVersionsByCategory(manifest?.versions || []);
    return ([
      ['all', 'download.versionFilter.all'],
      ['release', 'download.versionFilter.release'],
      ['snapshot', 'download.versionFilter.snapshot'],
      ['april', 'download.versionFilter.aprilFool'],
      ['old', 'download.versionFilter.old'],
    ] as const).map(([id, key]) => ({
      id,
      label: `${t(key)} (${counts[id]})`,
    }));
  }, [t, manifest?.versions]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    loadInstalledVersions().catch(e => {
      console.error('[DownloadGame] 加载已安装版本失败:', e);
    });

    getGameRoot().then(setGamesPath).catch(e => {
      console.error('[DownloadGame] 加载游戏目录失败:', e);
    });

    if (!manifest) {
      fetchManifest();
    }
  }, []);

  const versionsToShow = useMemo(() => {
    if (!manifest?.versions) return [];
    let versions = filterVersionsByCategory(manifest.versions, filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      versions = versions.filter(v =>
        v.id.toLowerCase().includes(query) ||
        (v.name && v.name.toLowerCase().includes(query))
      );
    }

    return versions;
  }, [manifest?.versions, filter, searchQuery]);

  const installedSet = useMemo(() =>
    new Set(installedVersions),
    [installedVersions]);


  const completedSet = useMemo(() =>
    new Set(completedVersions),
    [completedVersions]);

  const handleVersionClick = useCallback((version: GameVersion) => {
    navigate(`/download/game/${encodeURIComponent(version.id)}`);
    setCurrentPath(`/download/game/${encodeURIComponent(version.id)}`);
  }, [navigate, setCurrentPath]);

  const handleWikiClick = useCallback((versionId: string) => {
    openUrl(getWikiUrl(versionId));
  }, []);

  const notifyErrorRef = useRef(notifyError);
  notifyErrorRef.current = notifyError;

  // 30 秒内不报错：期间持续加载动画；超时仍未获取到 manifest 才提示错误
  const [manifestFailed, setManifestFailed] = useState(false);

  useEffect(() => {
    if (manifest) {
      setManifestFailed(false);
      return;
    }
    const timer = window.setTimeout(() => setManifestFailed(true), 30000);
    return () => window.clearTimeout(timer);
  }, [manifest]);

  useEffect(() => {
    if (manifestFailed && error) {
      notifyErrorRef.current(t('notification.error'), error);
    }
  }, [manifestFailed, t]);

  const handleOpenDownloadFolder = useCallback(async () => {
    if (!gamesPath) return;
    try {
      await openFolder(gamesPath);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.error'));
    }
  }, [gamesPath, notifyError, t]);

  const renderVersionItem = useCallback((version: GameVersion) => (
    <VersionListItem
      version={version}
      onClick={() => handleVersionClick(version)}
      onWikiClick={() => handleWikiClick(version.id)}
    />
  ), [installedSet, completedSet, handleVersionClick, handleWikiClick]);

  const handleRetry = useCallback(() => {
    fetchManifest();
  }, [fetchManifest]);

  return (
    <Page className="flex flex-col justify-center h-full min-h-0">

      <div className="min-h-0 pl-10 py-2 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full min-h-0 flex flex-col">

          <PageSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1, margin: '-40px' }}
              transition={{
                opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
                y: { ...EASING.SPRING_ENTER },
              }}
              className="flex flex-col sm:flex-row gap-3 mb-3 flex-shrink-0 px-4"
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('download.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-solid)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <DropDown
                options={filterOptions}
                value={filterOptions.find(o => o.id === filter)}
                onSelect={(o) => setFilter(o.id as VersionCategory)}
              />
            </motion.div>
          </PageSection>

          {!manifest ? (
            manifestLoading || loading || !manifestFailed ? (
              <div className="flex-1 min-h-0 px-4">
                <Skeleton.List count={12} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 px-4 flex flex-col items-center justify-center gap-3">
                <span className="text-sm text-text-tertiary">{t('download.loadFailed')}</span>
                <button
                  onClick={handleRetry}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium
                    bg-[var(--color-primary)]/10 text-[var(--color-primary)]
                    hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
                >
                  {t('download.retry')}
                </button>
              </div>
            )
          ) : versionsToShow.length === 0 ? (
            <PageSection>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1, margin: '-40px' }}
                transition={{
                  opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
                  y: { ...EASING.SPRING_ENTER },
                }}
              >
                <EmptyState
                  icon="search"
                  title={t('download.noVersion')}
                  description={t('download.noVersionDesc')}
                />
              </motion.div>
            </PageSection>
          ) : (
            <div className="flex-1 min-h-0 px-4">
              <VirtualList
                items={versionsToShow}
                keyExtractor={(v) => v.id}
                height="100%"
                itemHeight={ITEM_HEIGHT}
                overscan={5}
                className="h-full pr-4"
                renderItem={renderVersionItem}
              />
            </div>
          )}
        </div>

      </div>

      <BottomBar
        dir='download.downloadDir'
        cmdOpen='common.open'
        title='download.openFolder'
        path={gamesPath}
        handleOpenDownloadFolder={handleOpenDownloadFolder}
      />

    </Page>
  );
};

export default memo(DownloadGame);