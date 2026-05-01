import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, CheckCircle, Loader2, ArrowLeft, Settings, FolderPlus } from 'lucide-react';
import { downloadAndDeploy } from '@/helper/rustInvoke';
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
        loader_type: 'Vanilla',
        loader_version: null,
        target_existing_instance: installMode === 'existing' ? targetInstanceId : undefined,
      });
    } catch (e) {
      setIsInstalling(false);
      setPhases(prev => prev.map(p => p.status === 'active' ? { ...p, status: 'error' as const } : p));
      notifyError(t('deploy.failed', '安装失败'), e instanceof Error ? e.message : '未知错误');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[var(--color-bg-secondary)]">
        <button
          onClick={() => navigate('/download/game')}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', '返回')}
        </button>
        <h1 className="text-xl font-bold text-text-primary">Minecraft {versionId}</h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">{t('deploy.mode', '安装方式')}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setInstallMode('new')}
              className={`p-6 rounded-xl border-2 transition-all ${
                installMode === 'new'
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <FolderPlus className={`w-8 h-8 mb-3 ${installMode === 'new' ? 'text-primary' : 'text-text-tertiary'}`} />
              <p className="font-semibold text-text-primary">{t('deploy.newInst', '新建实例')}</p>
              <p className="text-sm text-text-tertiary mt-1">{t('deploy.newInstDesc', '创建全新的独立游戏环境')}</p>
            </button>
            
            <button
              onClick={() => setInstallMode('existing')}
              className={`p-6 rounded-xl border-2 transition-all ${
                installMode === 'existing'
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <Settings className={`w-8 h-8 mb-3 ${installMode === 'existing' ? 'text-primary' : 'text-text-tertiary'}`} />
              <p className="font-semibold text-text-primary">{t('deploy.existInst', '已有实例')}</p>
              <p className="text-sm text-text-tertiary mt-1">{t('deploy.existInstDesc', '安装到现有的实例目录')}</p>
            </button>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {installMode === 'new' && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-text-secondary text-sm font-medium">{t('deploy.instName', '实例名称')}</label>
              <input
                type="text"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder={`Minecraft ${versionId}`}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary text-lg focus:outline-none focus:border-primary transition-colors"
              />
            </motion.section>
          )}
        </AnimatePresence>

        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg 
                     flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {t('deploy.installing', '正在安装...')}
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              {t('deploy.startInstall', '开始下载并安装')}
            </>
          )}
        </button>

        <AnimatePresence>
          {isInstalling && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface border border-border rounded-xl p-6 space-y-4"
            >
              <h3 className="font-semibold text-text-primary">{t('deploy.progress', '安装进度')}</h3>
              
              {phases.map((phase, idx) => (
                <div key={phase.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    phase.status === 'completed' ? 'bg-success text-white' :
                    phase.status === 'active' ? 'bg-primary text-white animate-pulse' :
                    phase.status === 'error' ? 'bg-error text-white' :
                    'bg-border text-text-tertiary'
                  }`}>
                    {phase.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : phase.status === 'active' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>
                  
                  <span className={`flex-1 text-sm ${
                    phase.status === 'completed' ? 'text-text-primary line-through' :
                    phase.status === 'active' ? 'text-primary font-medium' :
                    'text-text-tertiary'
                  }`}>
                    {phase.label}
                  </span>

                  {phase.status === 'active' && phase.progress !== undefined && (
                    <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${phase.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {currentFile && (
                <p className="text-xs text-text-tertiary font-mono mt-2 truncate">
                  📄 {currentFile}
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VersionDetailWithInstall;
