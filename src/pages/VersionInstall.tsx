import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Minus, X, Loader2 } from 'lucide-react';
import { InstallCard, LoaderIcon, useNotification } from '../components/common';
import { getVersionDetail, createInstance, ModLoaderType, openUrl } from '../helper/rustInvoke';
import { checkLoaderCompatibility, getWikiUrl } from '../utils/modloaderCompat';
import { useNavStore } from '../stores/navStore';
import { useInstanceStore } from '../stores/instanceStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

type LoaderKey = 'minecraft' | 'forge' | 'neoforge' | 'optifine' | 'fabric' | 'fabricApi' | 'quilt' | 'qsl';

interface LoaderState {
  key: LoaderKey;
  titleI18nKey: string;
  modLoaderType: ModLoaderType | null;
  installed: boolean;
  selectedVersion: string | null;
  availableVersions: string[];
  compatible: boolean;
  reason?: string;
}

const VersionInstall = () => {
  const { t } = useTranslation();
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  const { setCurrentPath } = useNavStore();
  const { refresh } = useInstanceStore();
  const { success, error: notifyError, info } = useNotification();

  const [instanceName, setInstanceName] = useState(versionId || '');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [loaders, setLoaders] = useState<LoaderState[]>([]);

  useEffect(() => {
    const loadVersionDetail = async () => {
      if (!versionId) return;
      setLoading(true);
      try {
        const detail = await getVersionDetail(versionId);
        if (detail) {
          setInstanceName(versionId);
        }
        initLoaders(versionId);
      } catch (e) {
        notifyError('加载失败', e instanceof Error ? e.message : '无法获取版本信息');
      } finally {
        setLoading(false);
      }
    };
    loadVersionDetail();
  }, [versionId]);

  const initLoaders = (mcVersion: string) => {
    const loaderDefs: Omit<LoaderState, 'availableVersions' | 'compatible' | 'reason'>[] = [
      { key: 'minecraft', titleI18nKey: 'download.install.cards.minecraft', modLoaderType: null, installed: false, selectedVersion: mcVersion },
      { key: 'forge', titleI18nKey: 'download.install.cards.forge', modLoaderType: ModLoaderType.Forge, installed: false, selectedVersion: null },
      { key: 'neoforge', titleI18nKey: 'download.install.cards.neoforge', modLoaderType: ModLoaderType.NeoForge, installed: false, selectedVersion: null },
      { key: 'optifine', titleI18nKey: 'download.install.cards.optifine', modLoaderType: null, installed: false, selectedVersion: null },
      { key: 'fabric', titleI18nKey: 'download.install.cards.fabric', modLoaderType: ModLoaderType.Fabric, installed: false, selectedVersion: null },
      { key: 'fabricApi', titleI18nKey: 'download.install.cards.fabricApi', modLoaderType: null, installed: false, selectedVersion: null },
      { key: 'quilt', titleI18nKey: 'download.install.cards.quilt', modLoaderType: null, installed: false, selectedVersion: null },
      { key: 'qsl', titleI18nKey: 'download.install.cards.qsl', modLoaderType: null, installed: false, selectedVersion: null },
    ];

    const initialLoaders: LoaderState[] = loaderDefs.map(def => {
      const loaderName = def.modLoaderType || def.key;
      const compat = checkLoaderCompatibility(mcVersion, loaderName, []);
      return {
        ...def,
        availableVersions: [],
        compatible: compat.compatible,
        reason: compat.reason,
      };
    });

    setLoaders(initialLoaders);
  };

  const handleLoaderClick = useCallback(async (loader: LoaderState) => {
    if (!loader.compatible || !loader.modLoaderType) return;
    info(t('download.install.cards.selectVersion'), `${t(loader.titleI18nKey)}...`);
  }, [t, info]);

  const handleInstall = async () => {
    if (!versionId || !instanceName.trim()) {
      notifyError('安装失败', '请输入实例名称');
      return;
    }

    setInstalling(true);
    try {
      const selectedLoader = loaders.find(l => l.selectedVersion !== null && l.modLoaderType !== null);
      const loaderType = selectedLoader?.modLoaderType || ModLoaderType.Vanilla;
      const loaderVersion = selectedLoader?.selectedVersion || undefined;

      await createInstance(instanceName.trim(), versionId, loaderType, loaderVersion);
      await refresh();
      success(t('common.success'), t('download.install.installComplete'));
      navigate('/instance-list');
      setCurrentPath('/instance-list');
    } catch (e) {
      notifyError(t('download.install.installFailed'), e instanceof Error ? e.message : '安装失败');
    } finally {
      setInstalling(false);
    }
  };

  const handleBack = () => {
    navigate('/download/game');
    setCurrentPath('/download/game');
  };

  const handleWikiClick = () => {
    if (versionId) {
      openUrl(getWikiUrl(versionId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-text-tertiary">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Minecraft Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at center, rgba(96, 165, 250, 0.3) 0%, transparent 70%),
              linear-gradient(180deg, #87CEEB 0%, #4A90D9 40%, #5B8C5A 40%, #4A7A44 60%, #8B6914 60%, #6B4F0A 100%)
            `
          }}
        />
        {/* Noise overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-6 border-b border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-surface/80 hover:bg-surface transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5 text-text-primary" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-text-primary drop-shadow-sm">
                  {t('download.install.title')} - {versionId}
                </h1>
                <button
                  onClick={handleWikiClick}
                  className="text-xs text-text-secondary hover:text-primary transition-colors"
                >
                  {t('download.wiki')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-surface/80 hover:bg-surface transition-colors backdrop-blur-sm">
                <HelpCircle className="w-4 h-4 text-text-secondary" />
              </button>
              <button className="p-2 rounded-lg bg-surface/80 hover:bg-surface transition-colors backdrop-blur-sm">
                <Minus className="w-4 h-4 text-text-secondary" />
              </button>
              <button className="p-2 rounded-lg bg-surface/80 hover:bg-surface transition-colors backdrop-blur-sm">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-text-secondary whitespace-nowrap">
              {t('download.install.instanceName')}
            </label>
            <input
              type="text"
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              className="flex-1 px-4 py-2 bg-surface/80 border border-border/50 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors backdrop-blur-sm"
              placeholder={t('download.install.instanceNamePlaceholder')}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loaders.map(loader => (
              <InstallCard
                key={loader.key}
                icon={
                  <div className="w-full h-full">
                    <LoaderIcon type={loader.key} className="w-full h-full" />
                  </div>
                }
                title={t(loader.titleI18nKey)}
                subtitle={
                  loader.selectedVersion
                    ? loader.selectedVersion
                    : loader.compatible
                      ? t('download.install.cards.notInstalled')
                      : t('download.install.cards.incompatible')
                }
                status={
                  loader.selectedVersion
                    ? 'installed'
                    : !loader.compatible
                      ? 'incompatible'
                      : 'not_installed'
                }
                compatible={loader.compatible}
                onClick={() => handleLoaderClick(loader)}
              />
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-border/50 backdrop-blur-sm flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInstall}
            disabled={installing || !instanceName.trim()}
            className={cn(
              'px-8 py-3 rounded-lg text-sm font-medium transition-all',
              'bg-primary hover:bg-primary-hover text-text-primary',
              (installing || !instanceName.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {installing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('download.install.installing')}
              </span>
            ) : (
              t('download.install.installButton')
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default VersionInstall;
