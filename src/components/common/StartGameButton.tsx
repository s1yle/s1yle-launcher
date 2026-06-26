import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gamepad2 } from 'lucide-react';
import { launchInstance, stopInstance, getLaunchStatus, LaunchStatus, getCurrentAccount } from '../../helper/rustInvoke';
import { useInstanceStore } from '../../stores/instanceStore';
import type { AccountInfo } from '../../helper/rustInvoke';

/** 启动游戏按钮组件 Props */
export interface StartGameButtonProps {
  onClick?: () => void;
}

const ActionButton = ({ onClick }: StartGameButtonProps) => {
  const [status, setStatus] = useState<LaunchStatus>(LaunchStatus.Idle);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentAccount, setCurrentAccount] = useState<AccountInfo | null>(null);
  
  const selectedInstance = useInstanceStore(s => s.getSelectedInstance());
  
  useEffect(() => {
    const loadAccount = async () => {
      try {
        const account = await getCurrentAccount();
        setCurrentAccount(account);
      } catch (e) {
        console.error('获取账户失败:', e);
      }
    };
    loadAccount();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const currentStatus = await getLaunchStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('获取启动状态失败:', error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLaunch = async () => {
    if (isLoading) return;
    if (!selectedInstance) {
      setMessage('请先选择一个实例');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      setStatus(LaunchStatus.Launching);
      
      const username = currentAccount?.name || 'Steve';
      const uuid = currentAccount?.uuid || '069a79f4-44e9-4726-a5be-fca90e38aaf5';
      const accessToken = currentAccount?.account_type === 'microsoft' ? 'mock_token' : undefined;
      
      const result = await launchInstance({
        java_path: 'java',
        memory_mb: 2048,
        version: selectedInstance.version_id,
        game_dir: selectedInstance.path,
        assets_dir: `${selectedInstance.path}/assets`,
        username,
        uuid,
        access_token: accessToken,
      });
      
      setMessage(result);
      const currentStatus = await getLaunchStatus();
      setStatus(currentStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '启动失败');
      setStatus(LaunchStatus.Crashed);
      console.error('启动失败:', error);
    } finally {
      setIsLoading(false);
    }
    
    if (onClick) onClick();
  };

  const handleStop = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await stopInstance();
      setMessage(result);
      const currentStatus = await getLaunchStatus();
      setStatus(currentStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '停止失败');
      console.error('停止失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonInfo = () => {
    const instanceName = selectedInstance?.name || '未选择实例';
    const instanceVersion = selectedInstance?.version_id || '';
    
    switch (status) {
      case LaunchStatus.Idle:
        return {
          text: '启动游戏',
          subtext: instanceVersion ? `${instanceName} (${instanceVersion})` : instanceName,
          bgColor: 'bg-primary hover:bg-primary-hover',
          loading: false,
          action: handleLaunch
        };
      case LaunchStatus.Launching:
        return {
          text: '启动中...',
          subtext: '正在启动Minecraft',
          bgColor: 'bg-warning hover:bg-yellow-600',
          loading: true,
          action: () => {}
        };
      case LaunchStatus.Running:
        return {
          text: '游戏运行中',
          subtext: '点击停止游戏',
          bgColor: 'bg-success hover:bg-success',
          loading: false,
          action: handleStop
        };
      case LaunchStatus.Stopped:
        return {
          text: '已停止',
          subtext: '点击重新启动',
          bgColor: 'bg-surface hover:bg-gray-600',
          loading: false,
          action: handleLaunch
        };
      case LaunchStatus.Crashed:
        return {
          text: '启动失败',
          subtext: '点击重试',
          bgColor: 'bg-error hover:bg-error',
          loading: false,
          action: handleLaunch
        };
      default:
        return {
          text: '启动游戏',
          subtext: instanceVersion ? `${instanceName} (${instanceVersion})` : instanceName,
          bgColor: 'bg-primary hover:bg-primary-hover',
          loading: false,
          action: handleLaunch
        };
    }
  };

  const buttonInfo = getButtonInfo();
  const isDisabled = isLoading || status === LaunchStatus.Launching;

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-3">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[var(--color-context-bg)] text-[var(--color-text-primary)] px-5 py-3 rounded-xl shadow-xl max-w-sm text-sm border border-[var(--color-context-border)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === LaunchStatus.Running ? 'bg-[var(--color-success)] animate-pulse' :
              status === LaunchStatus.Launching ? 'bg-[var(--color-warning)]' :
              status === LaunchStatus.Crashed ? 'bg-[var(--color-error)]' :
              'bg-[var(--color-text-secondary)]'
            }`} />
            {message}
          </div>
        </motion.div>
      )}
      
      <motion.button
        onClick={buttonInfo.action}
        disabled={isDisabled}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`
          group relative overflow-hidden
          ${buttonInfo.bgColor} text-white 
          px-10 py-4 rounded-2xl shadow-2xl 
          transition-all duration-300 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          hover:shadow-3xl active:scale-95
          flex flex-col items-center justify-center min-w-[200px]
        `}
      >
        {/* 背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {buttonInfo.loading ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-bold tracking-wide">{buttonInfo.text}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-lg font-bold tracking-wide">{buttonInfo.text}</span>
            </div>
            <span className="text-xs font-medium opacity-90 mt-1.5 tracking-wider uppercase">
              {buttonInfo.subtext}
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ActionButton;
