import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useDownloadStore } from '../../stores/downloadStore';
import { GameVersion, openFolder, openUrl } from '../../helper/rustInvoke';
import { VersionListItem, VersionFilterDropdown, EmptyState, useNotification, VirtualList } from '../../components/common';
import { useNavStore } from '../../stores/navStore';
import { getWikiUrl } from '../../utils/modloaderCompat';
import { VersionCategory, filterVersionsByCategory, debugVersionTypes } from '../../utils/versionFilter';
import BottomBar from '@/components/common/BottomBar/BottomBar';

const ITEM_HEIGHT = 72;

const DownloadGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentPath } = useNavStore();
  const {
    manifest,
    installedVersions,
    basePath,
    loading,
    error,
    downloadVersion,
    loadManifest,
    loadInstalledVersions,
    loadBasePath,
    downloadingVersions,
    completedVersions,
  } = useDownloadStore();

  const { error: notifyError, success, info } = useNotification();

  const [filter, setFilter] = useState<VersionCategory>('release');
  const [searchQuery, setSearchQuery] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    loadInstalledVersions().catch(e => {
      console.error('[DownloadGame] 加载已安装版本失败:', e);
    });

    loadBasePath().catch(e => {
      console.error('[DownloadGame] 加载下载路径失败:', e);
    });

    if (!manifest) {
      loadManifest().catch(e => {
        console.error('[DownloadGame] 加载版本列表失败:', e);
      });
    }
  }, []);

  useMemo(() => {
    if (manifest?.versions) {
      console.log('=== Version Types Debug ===');
      debugVersionTypes(manifest.versions);
    }
  }, [manifest?.versions]);

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

  const downloadingSet = useMemo(() => {
    const set = new Set<string>();
    downloadingVersions.forEach((value, key) => {
      if (value.status === 'downloading') {
        set.add(key);
      }
    });
    return set;
  }, [downloadingVersions]);

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

  const handleDownload = useCallback(async (version: GameVersion) => {
    navigate(`/download/game/${encodeURIComponent(version.id)}`);
    setCurrentPath(`/download/game/${encodeURIComponent(version.id)}`);
  }, [navigate, setCurrentPath]);

  const notifyErrorRef = useRef(notifyError);
  notifyErrorRef.current = notifyError;

  useEffect(() => {
    if (error) {
      notifyErrorRef.current(t('notification.error'), error);
    }
  }, [error, t]);

  const handleOpenDownloadFolder = useCallback(async () => {
    if (!basePath) return;
    try {
      await openFolder(basePath);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.error'));
    }
  }, [basePath, notifyError, t]);

  const renderVersionItem = useCallback((version: GameVersion) => (
    <VersionListItem
      version={version}
      installed={installedSet.has(version.id) || completedSet.has(version.id)}
      onClick={() => handleVersionClick(version)}
      onWikiClick={() => handleWikiClick(version.id)}
    />
  ), [installedSet, completedSet, handleVersionClick, handleWikiClick]);

  const isLoading = loading && !manifest;

  return (
    <div className="flex flex-col h-full min-h-0">

      <div className="flex-1 min-h-0 px-0 py-2 overflow-hidden">
        <div className="h-full min-h-0 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-3 mb-3 flex-shrink-0 px-4">
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
            <VersionFilterDropdown
              value={filter}
              onChange={setFilter}
              versions={manifest?.versions || []}
            />
          </div>
          
          {manifest?.latest && (
            <div className="p-2 rounded-lg mb-2 flex-shrink-0 px-4"
              style={{ backgroundColor: 'var(--color-primary-bg)', borderColor: 'var(--color-primary)', borderWidth: '1px', borderStyle: 'solid' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                {t('download.latestRelease')}: <span className="font-mono font-bold">{manifest.latest.release}</span>
                {manifest.latest.snapshot !== manifest.latest.release && (
                  <> | {t('download.latestSnapshot')}: <span className="font-mono font-bold">{manifest.latest.snapshot}</span></>
                )}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
              </motion.div>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{t('common.loading')}</span>
            </div>
          ) : versionsToShow.length === 0 ? (
            <EmptyState
              icon="search"
              title={t('download.noVersion')}
              description={t('download.noVersionDesc')}
            />
          ) : (
            <div className="flex-1 min-h-0 px-4">
              <VirtualList
                items={versionsToShow}
                height="100%"
                itemHeight={ITEM_HEIGHT}
                overscan={5}
                className="h-full"
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
        path={basePath}
        handleOpenDownloadFolder={handleOpenDownloadFolder}
      />
      
    </div>
  );
};

export default memo(DownloadGame);