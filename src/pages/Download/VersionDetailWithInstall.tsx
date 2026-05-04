import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, CheckCircle, Loader2, ArrowLeft, Settings, FolderPlus, Sparkles, Box, Gamepad2 } from 'lucide-react';
import { downloadAndDeploy, ModLoaderType } from '@/helper/rustInvoke';
import { useNotification } from '@/components/common';
import { listen } from '@tauri-apps/api/event';

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

    const unlistenProgress = listen<any>('deploy-progress', (event) => {
      setCurrentFile(event.payload.file || '');
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
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[var(--color-bg-primary)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4">
              <Gamepad2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Minecraft <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{versionId}</span>
            </h1>
            <p className="text-text-tertiary text-lg">准备开始安装游戏</p>
          </motion.div>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              安装方式
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={() => setInstallMode('new')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  installMode === 'new'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 shadow-lg shadow-emerald-500/10'
                    : 'border-border hover:border-border-hover bg-surface'
                }`}
              >
                {installMode === 'new' && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute top-3 right-3 w-3 h-3 rounded-full bg-emerald-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <FolderPlus className={`w-8 h-8 mb-3 ${installMode === 'new' ? 'text-emerald-400' : 'text-text-tertiary'}`} />
                <p className="font-bold text-text-primary text-lg">新建实例</p>
                <p className="text-sm text-text-tertiary mt-1">创建全新的独立游戏环境</p>
              </motion.button>

              <motion.button
                onClick={() => setInstallMode('existing')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  installMode === 'existing'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 shadow-lg shadow-emerald-500/10'
                    : 'border-border hover:border-border-hover bg-surface'
                }`}
              >
                {installMode === 'existing' && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute top-3 right-3 w-3 h-3 rounded-full bg-emerald-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Settings className={`w-8 h-8 mb-3 ${installMode === 'existing' ? 'text-emerald-400' : 'text-text-tertiary'}`} />
                <p className="font-bold text-text-primary text-lg">已有实例</p>
                <p className="text-sm text-text-tertiary mt-1">安装到现有的实例目录</p>
              </motion.button>
            </div>
          </section>

          <AnimatePresence mode="wait">
            {installMode === 'new' && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  实例名称
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder={`Minecraft ${versionId}`}
                  className="w-full px-5 py-4 bg-surface border-2 border-border rounded-xl text-text-primary text-lg font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-text-tertiary/50"
                />
              </motion.section>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleInstall}
            disabled={isInstalling}
            whileHover={!isInstalling ? { scale: 1.01 } : {}}
            whileTap={!isInstalling ? { scale: 0.99 } : {}}
            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                正在安装...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                开始下载并安装
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {isInstalling && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface border-2 border-border rounded-2xl p-8 space-y-6"
              >
                <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  安装进度
                </h3>

                <div className="space-y-3">
                  {phases.map((phase, idx) => (
                    <motion.div
                      key={phase.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        phase.status === 'completed'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : phase.status === 'active'
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/30 animate-pulse'
                          : phase.status === 'error'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                          : 'bg-border text-text-tertiary'
                      }`}>
                        {phase.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : phase.status === 'active' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium transition-colors ${
                          phase.status === 'completed'
                            ? 'text-text-tertiary line-through'
                            : phase.status === 'active'
                            ? 'text-emerald-400 font-semibold'
                            : phase.status === 'error'
                            ? 'text-red-400'
                            : 'text-text-secondary'
                        }`}>
                          {phase.label}
                        </p>

                        {phase.status === 'active' && phase.progress !== undefined && (
                          <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${phase.progress}%` }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        )}
                      </div>

                      {phase.status === 'active' && (
                        <span className="text-xs text-emerald-400 font-mono animate-pulse">
                          进行中...
                        </span>
                      )}

                      {phase.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {currentFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                  >
                    <p className="text-xs text-emerald-400 font-mono truncate flex items-center gap-2">
                      <Download className="w-3 h-3 flex-shrink-0" />
                      {currentFile}
                    </p>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VersionDetailWithInstall;