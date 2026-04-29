import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, RotateCcw, FolderOpen } from 'lucide-react';
import { useInstanceConfig } from '@/hooks/useConfig';
import { useNotification } from '@/components/common';
import { openFolder } from '@/helper/rustInvoke';
import type { InstanceConfig } from '@/helper/rustInvoke';

interface InstanceConfigPanelProps {
  instanceId: string;
  instanceName: string;
  onClose: () => void;
}

const InstanceConfigPanel: React.FC<InstanceConfigPanelProps> = ({
  instanceId,
  instanceName,
  onClose,
}) => {
  const { t } = useTranslation();
  const { instanceConfig, updateJava, updateMemory, removeInstanceConfig } = useInstanceConfig(instanceId);
  const { success, error: notifyError } = useNotification();

  // Java 配置状态
  const [javaPath, setJavaPath] = useState('');
  const [javaArgs, setJavaArgs] = useState('');
  const [useBundled, setUseBundled] = useState(true);

  // 内存配置状态
  const [minMemory, setMinMemory] = useState(512);
  const [maxMemory, setMaxMemory] = useState(2048);

  // 加载状态
  const [isSaving, setIsSaving] = useState(false);

  // 初始化配置
  useEffect(() => {
    if (instanceConfig) {
      setJavaPath(instanceConfig.java.java_path || '');
      setJavaArgs(instanceConfig.java.java_args.join(' '));
      setUseBundled(instanceConfig.java.use_bundled);
      setMinMemory(instanceConfig.memory.min_memory);
      setMaxMemory(instanceConfig.memory.max_memory);
    }
  }, [instanceConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 更新 Java 配置
      const argsArray = javaArgs.split(' ').filter(Boolean);
      await updateJava(javaPath || null, argsArray);

      // 更新内存配置
      await updateMemory(minMemory, maxMemory);

      success('配置已保存', '实例配置已成功更新');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败';
      notifyError('保存失败', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要重置此实例的配置吗？')) return;

    try {
      await removeInstanceConfig(instanceId);
      success('配置已重置', '实例配置已恢复默认值');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '重置失败';
      notifyError('重置失败', msg);
    }
  };

  const handleOpenFolder = async () => {
    if (instanceConfig) {
      try {
        await openFolder(instanceConfig.path || instanceId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '打开目录失败';
        notifyError('打开目录失败', msg);
      }
    }
  };

  if (!instanceConfig) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface rounded-xl p-8 border border-border">
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {t('instance.config', '实例配置')}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{instanceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* Java 配置 */}
          <section>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              {t('instance.java', 'Java 设置')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-tertiary mb-2">
                  {t('instance.javaPath', 'Java 路径')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={javaPath}
                    onChange={(e) => setJavaPath(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="例如：C:/Program Files/Java/jdk-17/bin/java.exe"
                    disabled={useBundled}
                  />
                  <button
                    onClick={handleOpenFolder}
                    className="p-2 bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    title="打开实例目录"
                  >
                    <FolderOpen className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-tertiary mb-2">
                  {t('instance.javaArgs', 'Java 参数')}
                </label>
                <input
                  type="text"
                  value={javaArgs}
                  onChange={(e) => setJavaArgs(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="-Xmx2G -Xms1G -XX:+UseG1GC"
                  disabled={useBundled}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useBundled"
                  checked={useBundled}
                  onChange={(e) => setUseBundled(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-bg-surface text-primary focus:ring-primary"
                />
                <label htmlFor="useBundled" className="text-sm text-text-secondary">
                  {t('instance.useBundledJava', '使用内置 Java')}
                </label>
              </div>
            </div>
          </section>

          {/* 内存配置 */}
          <section>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              {t('instance.memory', '内存设置')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-tertiary mb-2">
                  {t('instance.minMemory', '最小内存 (MB)')}
                </label>
                <input
                  type="number"
                  value={minMemory}
                  onChange={(e) => setMinMemory(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  min="128"
                  step="128"
                />
              </div>
              <div>
                <label className="block text-sm text-text-tertiary mb-2">
                  {t('instance.maxMemory', '最大内存 (MB)')}
                </label>
                <input
                  type="number"
                  value={maxMemory}
                  onChange={(e) => setMaxMemory(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  min="512"
                  step="256"
                />
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              {t('instance.memoryHint', '提示：建议设置为物理内存的 1/4 到 1/2')}
            </p>
          </section>

          {/* 实例信息 */}
          <section>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              {t('instance.info', '实例信息')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">{t('instance.version', '版本')}</span>
                <span className="text-text-primary">{instanceConfig.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">{t('instance.loader', '加载器')}</span>
                <span className="text-text-primary">
                  {instanceConfig.loader_type}
                  {instanceConfig.loader_version && ` ${instanceConfig.loader_version}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">{t('instance.createdAt', '创建时间')}</span>
                <span className="text-text-primary">
                  {new Date(instanceConfig.created_at * 1000).toLocaleDateString('zh-CN')}
                </span>
              </div>
              {instanceConfig.last_played && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('instance.lastPlayed', '最后游玩')}</span>
                  <span className="text-text-primary">
                    {new Date(instanceConfig.last_played * 1000).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-surface/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('common.reset', '重置')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-text-primary transition-colors"
          >
            {t('common.cancel', '取消')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-text-primary transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t('common.saving', '保存中...') : t('common.save', '保存')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstanceConfigPanel;
