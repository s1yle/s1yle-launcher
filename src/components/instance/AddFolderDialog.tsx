import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { validateFolder, addValidatedFolder } from '@/helper/rustInvoke';
import { useInstanceStore } from '@/stores/instanceStore';
import { useNotification } from '@/components/common';
import { FolderOpen, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface AddFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFolderDialog: React.FC<AddFolderDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { addKnownFolder, refreshKnownFolders, refresh } = useInstanceStore();
  const { success, error: notifyError, warning } = useNotification();

  const [selectedPath, setSelectedPath] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  const handleBrowse = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('instances.selectFolderTitle', '选择 Minecraft 实例文件夹'),
      });
      
      if (selected) {
        setSelectedPath(selected);
        setCustomName('');
        setValidationResult(null);
        
        setValidating(true);
        try {
          const result = await validateFolder(selected);
          setValidationResult(result);
          
          if (!result.is_valid) {
            warning(t('instances.folderNotValid', '未检测到有效实例'), 
              result.warnings?.join('\n') || t('instances.noInstancesFound', '该目录中未找到 Minecraft 实例'));
          }
        } catch (e) {
          notifyError(t('notification.error'), e instanceof Error ? e.message : '验证失败');
        } finally {
          setValidating(false);
        }
      }
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : '选择文件夹失败');
    }
  }, [t, notifyError, warning]);

  const handleConfirm = async () => {
    if (!selectedPath || !validationResult?.is_valid) return;
    
    setAdding(true);
    try {
      await addValidatedFolder(selectedPath, customName || undefined);
      await refreshKnownFolders();
      await refresh();
      
      success(
        t('instances.folderAdded', '文件夹已添加'),
        t('instances.folderAddedMsg', '"{{name}}" 已添加，发现 {{count}} 个实例', { 
          name: customName || validationResult.suggested_name, 
          count: validationResult.instances?.length || 0 
        })
      );
      onClose();
    } catch (e) {
      notifyError(t('instances.addFolderFailed', '添加失败'), e instanceof Error ? e.message : '操作失败');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
      <div className="bg-context-bg border border-border-hover rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          {t('instances.addFolderTitle', '添加游戏文件夹')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm mb-1 block">
              {t('instances.folderPath', '文件夹路径')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedPath}
                readOnly
                placeholder={t('instances.browsePlaceholder', '点击浏览选择...')}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm"
              />
              <button
                onClick={handleBrowse}
                disabled={validating}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-lg transition-colors text-sm font-medium"
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.browse', '浏览')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-text-secondary text-sm mb-1 block">
              {t('instances.displayName', '显示名称')} ({t('common.optional', '可选')})
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={validationResult?.suggested_name || t('instances.autoDetect', '自动检测')}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm"
            />
          </div>

          {validating && (
            <div className="flex items-center gap-2 text-text-tertiary py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t('instances.validating', '正在分析目录...')}</span>
            </div>
          )}

          {validationResult && !validating && (
            <div className={`p-3 rounded-lg border ${
              validationResult.is_valid 
                ? 'border-success/30 bg-success/5' 
                : 'border-warning/30 bg-warning/5'
            }`}>
              <div className="flex items-start gap-2">
                {validationResult.is_valid ? (
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${validationResult.is_valid ? 'text-success' : 'text-warning'}`}>
                    {validationResult.is_valid 
                      ? t('instances.foundInstances', '检测到 {{count}} 个有效实例', { count: validationResult.instances?.length || 0 })
                      : t('instances.noValidInstances', '未找到有效实例')
                    }
                  </p>
                  
                  {validationResult.instances?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {validationResult.instances.map((inst: any, idx: number) => (
                        <div key={idx} className="text-xs text-text-secondary font-mono bg-surface px-2 py-1 rounded">
                          📦 {inst.name} ({inst.version})
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult.warnings?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validationResult.warnings.map((w: string, idx: number) => (
                        <li key={idx} className="text-xs text-text-tertiary">⚠️ {w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary rounded-lg transition-colors">
            {t('common.cancel', '取消')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPath || !validationResult?.is_valid || adding}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {adding && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('instances.addFolder', '添加文件夹')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFolderDialog;
