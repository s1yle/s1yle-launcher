import { useState, useEffect } from 'react';
import { launchInstance, stopInstance, getLaunchStatus, LaunchStatus } from '../helper/rustInvoke';

interface ActionButtonProps {
  onClick?: () => void;
}

const ActionButton = ({ onClick }: ActionButtonProps) => {
  const [status, setStatus] = useState<LaunchStatus>(LaunchStatus.Idle);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 定期检查启动状态
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const currentStatus = await getLaunchStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('获取启动状态失败:', error);
      }
    }, 3000); // 每3秒检查一次

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, []);

  // 根据状态确定按钮文本和样式
  const getButtonInfo = () => {
    switch (status) {
      case LaunchStatus.Idle:
        return {
          text: '启动游戏',
          subtext: 'Vault Hunters Official Pack',
          bgColor: 'bg-indigo-500 hover:bg-indigo-600',
          loading: false,
          action: handleLaunch
        };
      case LaunchStatus.Launching:
        return {
          text: '启动中...',
          subtext: '正在启动Minecraft',
          bgColor: 'bg-yellow-500 hover:bg-yellow-600',
          loading: true,
          action: () => {} // 启动中不可点击
        };
      case LaunchStatus.Running:
        return {
          text: '游戏运行中',
          subtext: '点击停止游戏',
          bgColor: 'bg-green-500 hover:bg-green-600',
          loading: false,
          action: handleStop
        };
      case LaunchStatus.Stopped:
        return {
          text: '已停止',
          subtext: '点击重新启动',
          bgColor: 'bg-gray-500 hover:bg-gray-600',
          loading: false,
          action: handleLaunch
        };
      case LaunchStatus.Crashed:
        return {
          text: '启动失败',
          subtext: '点击重试',
          bgColor: 'bg-red-500 hover:bg-red-600',
          loading: false,
          action: handleLaunch
        };
      default:
        return {
          text: '启动游戏',
          subtext: 'Vault Hunters Official Pack',
          bgColor: 'bg-indigo-500 hover:bg-indigo-600',
          loading: false,
          action: handleLaunch
        };
    }
  };

  const handleLaunch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      setStatus(LaunchStatus.Launching);
      const result = await launchInstance();
      setMessage(result);
      
      // 更新状态
      const currentStatus = await getLaunchStatus();
      setStatus(currentStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '启动失败');
      setStatus(LaunchStatus.Crashed);
      console.error('启动失败:', error);
    } finally {
      setIsLoading(false);
    }
    
    // 如果提供了外部onClick，也执行
    if (onClick) onClick();
  };

  const handleStop = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await stopInstance();
      setMessage(result);
      
      // 更新状态
      const currentStatus = await getLaunchStatus();
      setStatus(currentStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '停止失败');
      console.error('停止失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonInfo = getButtonInfo();
  const isDisabled = isLoading || status === LaunchStatus.Launching;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2">
      {message && (
        <div className="bg-gray-800/90 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs text-sm">
          {message}
        </div>
      )}
      
      <button
        onClick={buttonInfo.action}
        disabled={isDisabled}
        className={`${buttonInfo.bgColor} text-white px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-95 flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {buttonInfo.loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-lg font-bold">{buttonInfo.text}</span>
          </div>
        ) : (
          <>
            <span className="text-lg font-bold">{buttonInfo.text}</span>
            <span className="text-xs opacity-90 mt-1">{buttonInfo.subtext}</span>
          </>
        )}
      </button>
      
      {/* 状态指示器 */}
      <div className="flex items-center space-x-2 text-xs text-gray-300">
        <div className={`w-2 h-2 rounded-full ${
          status === LaunchStatus.Running ? 'bg-green-500 animate-pulse' :
          status === LaunchStatus.Launching ? 'bg-yellow-500' :
          status === LaunchStatus.Crashed ? 'bg-red-500' :
          'bg-gray-500'
        }`}></div>
        <span>状态: {status}</span>
      </div>
    </div>
  );
};

export default ActionButton;
