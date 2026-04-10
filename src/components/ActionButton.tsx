import { useState, useEffect } from 'react';
import { Loader2, Gamepad2 } from 'lucide-react';
import { launchInstance, stopInstance, getLaunchStatus, LaunchStatus, getCurrentAccount } from '../helper/rustInvoke';
import { useInstanceStore } from '../stores/instanceStore';
import type { AccountInfo } from '../helper/rustInvoke';

interface ActionButtonProps {
  onClick?: () => void;
}

const ActionButton = ({ onClick }: ActionButtonProps) => {
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
        version: selectedInstance.version,
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
    const instanceVersion = selectedInstance?.version || '';
    
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
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2">
      {message && (
        <div className="bg-context-bg text-text-primary px-4 py-2 rounded-lg shadow-lg max-w-xs text-sm">
          {message}
        </div>
      )}
      
      <button
        onClick={buttonInfo.action}
        disabled={isDisabled}
        className={`${buttonInfo.bgColor} text-text-primary px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-95 flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {buttonInfo.loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-bold">{buttonInfo.text}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-lg font-bold">{buttonInfo.text}</span>
            </div>
            <span className="text-xs opacity-90 mt-1">{buttonInfo.subtext}</span>
          </>
        )}
      </button>
      
      <div className="flex items-center space-x-2 text-xs text-text-secondary">
        <div className={`w-2 h-2 rounded-full ${
          status === LaunchStatus.Running ? 'bg-success animate-pulse' :
          status === LaunchStatus.Launching ? 'bg-warning' :
          status === LaunchStatus.Crashed ? 'bg-error' :
          'bg-surface'
        }`}></div>
        <span>状态: {status}</span>
      </div>
    </div>
  );
};

export default ActionButton;
