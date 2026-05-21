import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  Settings, 
  FolderPlus, 
  Sparkles, 
  Box, 
  Gamepad2,
  HardDrive,
  User,
} from 'lucide-react';
import { downloadAndDeploy, ModLoaderType } from '@/helper/rustInvoke';
import { useNotification } from '@/components/common';
import { listen } from '@tauri-apps/api/event';
import { useDownloadStore } from '../../stores/downloadStore';
import SettingsSection from '@/components/common/settings/SettingsSection';
import SettingItem from '@/components/common/settings/SettingItem';
import ListItem from '@/components/common/ListItem';
import ProgressBar from '@/components/common/ProgressBar';

interface DeployPhase {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
}

const VersionDetailWithInstall: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { versionId } = useParams<{ versionId: string }>();

  const { success, error: notifyError, info } = useNotification();
  const { startDownloadProgress, updateDownloadProgress, completeDownloadProgress, errorDownloadProgress } = useDownloadStore();

  const [installMode, setInstallMode] = useState<'new' | 'existing'>('new');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [targetInstanceId, setTargetInstanceId] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [phases, setPhases] = useState<DeployPhase[]>([
    { key: 'validate', label: t('deploy.phaseValidate', '校验版本'), status: 'pending' },
    { key: 'download', label: t('deploy.phaseDownload', '下载资源'), status: 'pending' },
    { key: 'deploy', label: t('deploy.phaseDeploy', '部署文件'), status: 'pending' },
    { key: 'configure', label: t('deploy.phaseConfigure', '写入配置'), status: 'pending' },
    { key: 'complete', label: t('deploy.phaseComplete', '完成'), status: 'pending' },
  ]);
  const [currentFile, setCurrentFile] = useState('');

  useEffect(() => {
    if (versionId) setNewInstanceName(`Minecraft ${versionId}`);
    
    // 滚动到顶部
    window.scrollTo(0, 0);

    const unlistenProgress = listen<any>('deploy-progress', (event) => {
      const { file } = event.payload;
      setCurrentFile(file || '');
    });

    const unlistenStatus = listen<any>('deploy-status', (event) => {
      setPhases(prev => prev.map(p => {
        if (p.status === 'completed') return p;
        if (p.key === event.payload.phase) return { ...p, status: 'active' as const };
        const order = ['validate', 'download', 'deploy', 'configure', 'complete'];
        const curIdx = order.indexOf(event.payload.phase);
        const thisIdx = order.indexOf(p.key);
        if (thisIdx < curIdx) return { ...p, status: 'completed' as const, progress: 100 };
        return p;
      }));
    });

    const unlistenComplete = listen<any>('deploy-complete', async (event) => {
      if (event.payload.status === 'success') {
        setPhases(prev => prev.map(p => ({ ...p, status: 'completed' as const, progress: 100 })));
        setIsInstalling(false);
        success(t('deploy.success', '安装完成'), t('deploy.successMsg', '{{version}} 已成功安装', { version: versionId }));
        setTimeout(() => navigate('/instance-list'), 1500);
      }
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenStatus.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, [versionId, t, success, navigate]);

  const handleInstall = async () => {
    if (!versionId) return;
    if (installMode === 'new' && !newInstanceName.trim()) {
      notifyError(t('deploy.nameRequired', '请输入实例名称'));
      return;
    }

    setIsInstalling(true);
    setPhases(prev => prev.map(p => ({ ...p, status: 'pending' as const, progress: undefined })));

    try {
      info(t('deploy.starting', '开始安装...'));
      startDownloadProgress(versionId);

      await downloadAndDeploy({
        instance_name: newInstanceName,
        version_id: versionId,
        loader_type: ModLoaderType.Vanilla,
        loader_version: null,
        target_existing_instance: installMode === 'existing' ? targetInstanceId : null,
      });
    } catch (e) {
      setIsInstalling(false);
      setPhases(prev => prev.map(p => p.status === 'active' ? { ...p, status: 'error' as const } : p));
      notifyError(t('deploy.failed', '安装失败'), e instanceof Error ? e.message : '未知错误');
      errorDownloadProgress(versionId, e instanceof Error ? e.message : '未知错误');
    }
  };

  const handleBack = useCallback(() => {
    navigate('/download/game');
  }, [navigate]);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[var(--color-bg-primary)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* 安装方式选择 */}
          <SettingsSection
            title="安装方式"
            titleI18nKey="deploy.installMode"
            icon={<Sparkles className="w-5 h-5" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <ListItem
                title="新建实例"
                subtitle="创建全新的独立游戏环境"
                icon={<FolderPlus className="w-5 h-5" />}
                selected={installMode === 'new'}
                onClick={() => setInstallMode('new')}
                size="lg"
                className="min-h-[100px] flex flex-col justify-center"
              />
              <ListItem
                title="已有实例"
                subtitle="安装到现有的实例目录"
                icon={<Settings className="w-5 h-5" />}
                selected={installMode === 'existing'}
                onClick={() => setInstallMode('existing')}
                size="lg"
                className="min-h-[100px] flex flex-col justify-center"
              />
            </div>
          </SettingsSection>

          {/* 实例名称输入 */}
          <AnimatePresence mode="wait">
            {installMode === 'new' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsSection
                  title="实例配置"
                  titleI18nKey="deploy.instanceConfig"
                  icon={<Box className="w-5 h-5" />}
                >
                  <SettingItem
                    label="实例名称"
                    labelI18nKey="deploy.instanceName"
                    description={`默认：Minecraft ${versionId}`}
                  >
                    <input
                      type="text"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      placeholder={`Minecraft ${versionId}`}
                      className="px-4 py-2 w-64 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </SettingItem>
                </SettingsSection>
              </motion.div>
            )}

            {installMode === 'existing' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsSection
                  title="选择实例"
                  titleI18nKey="deploy.selectInstance"
                  icon={<User className="w-5 h-5" />}
                >
                  <SettingItem
                    label="目标实例"
                    labelI18nKey="deploy.targetInstance"
                    description="选择要安装到的现有实例"
                  >
                    <select
                      value={targetInstanceId}
                      onChange={(e) => setTargetInstanceId(e.target.value)}
                      className="px-4 py-2 w-64 bg-[var(--color-input)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">请选择实例...</option>
                      {/* TODO: 从 store 获取实例列表 */}
                    </select>
                  </SettingItem>
                </SettingsSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 磁盘空间信息 */}
          <SettingsSection
            title="存储信息"
            titleI18nKey="deploy.storage"
            icon={<HardDrive className="w-5 h-5" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">预计占用空间</span>
                <span className="text-[var(--color-text-primary)] font-medium">~200 MB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">可用空间</span>
                <span className="text-[var(--color-text-primary)] font-medium">~50 GB</span>
              </div>
            </div>
          </SettingsSection>

          {/* 安装按钮 */}
          {!isInstalling && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={handleInstall}
                className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] hover:from-[var(--color-primary-hover)] hover:to-[var(--color-primary)] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <Download className="w-6 h-6" />
                开始下载并安装
              </button>
            </motion.div>
          )}

          {/* 安装进度 */}
          <AnimatePresence>
            {isInstalling && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SettingsSection
                  title="安装进度"
                  titleI18nKey="deploy.progress"
                  icon={<Loader2 className="w-5 h-5 animate-spin" />}
                >
                  <div className="space-y-4">
                    {phases.map((phase, idx) => (
                      <div key={phase.key} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          phase.status === 'completed'
                            ? 'bg-[var(--color-success)] text-white'
                            : phase.status === 'active'
                            ? 'bg-[var(--color-primary)] text-white animate-pulse'
                            : phase.status === 'error'
                            ? 'bg-[var(--color-error)] text-white'
                            : 'bg-[var(--color-surface-active)] text-[var(--color-text-tertiary)]'
                        }`}>
                          {phase.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : phase.status === 'active' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${
                              phase.status === 'active'
                                ? 'text-[var(--color-primary)]'
                                : phase.status === 'error'
                                ? 'text-[var(--color-error)]'
                                : 'text-[var(--color-text-secondary)]'
                            }`}>
                              {phase.label}
                            </span>
                            {phase.status === 'active' && (
                              <span className="text-xs text-[var(--color-text-tertiary)] animate-pulse">
                                进行中...
                              </span>
                            )}
                          </div>
                          
                          {phase.status === 'active' && phase.progress !== undefined && (
                            <ProgressBar 
                              progress={phase.progress} 
                              size="sm"
                              showPercentage={false}
                              barClassName="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]"
                            />
                          )}
                        </div>

                        {phase.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
                        )}
                      </div>
                    ))}

                    {currentFile && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-tertiary)] font-mono truncate">
                          当前文件：{currentFile}
                        </div>
                      </div>
                    )}
                  </div>
                </SettingsSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VersionDetailWithInstall;
