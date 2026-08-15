import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { launchGame, getCurrentAccount, getGameSettings, getGlobalGameSettings } from '../../helper/rustInvoke';
import { useGameStore } from '../../stores/gameStore';
import type { AccountInfo } from '../../helper/rustInvoke';
import { useNotification } from './NotificationProvider';
import { fadeInUp } from '@/utils/animations';

/** 启动游戏按钮组件 Props */
export interface StartGameButtonProps {
  /** 启动成功后回调（参数为游戏会话 ID） */
  onLaunched?: (gameId: string) => void;
  className?: string;
}

const ActionButton = ({ onLaunched, className }: StartGameButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<AccountInfo | null>(null);
  const { error } = useNotification();

  const selectedGame = useGameStore(s => s.getSelectedGame());

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

  const handleLaunch = async () => {
    if (isLoading) return;
    if (!selectedGame) {
      error('提示', '请先选择一个游戏');
      return;
    }

    setIsLoading(true);
    try {
      // 启动前实时拉取最新设置（避免设置页保存后 store 快照过期）；
      // 未启用独立设置时使用全局设置，启用时才使用游戏独立设置
      const [gameSettings, globalSettings] = await Promise.all([
        getGameSettings(selectedGame.name),
        getGlobalGameSettings(),
      ]);
      const settings = gameSettings.use_game_settings ? gameSettings : globalSettings;
      const javaPath = settings.java_path || 'java';
      const maxMemory = settings.max_memory || 2048;

      const username = currentAccount?.name || 'Steve';
      const uuid = currentAccount?.uuid || '069a79f4-44e9-4726-a5be-fca90e38aaf5';
      const accountType = currentAccount?.account_type || 'offline';

      const gameId = await launchGame({
        java_path: javaPath,
        memory_mb: maxMemory,
        version: selectedGame.version_id,
        game_dir: selectedGame.path,
        assets_dir: `${selectedGame.path}/assets`,
        natives_dir: `${selectedGame.path}/versions/${selectedGame.version_id}/natives`,
        username,
        uuid,
        account_type: accountType,
        jvm_args: settings.jvm_args || [],
        resolution_width: settings.width,
        resolution_height: settings.height,
      });

      onLaunched?.(gameId);
    } catch (e) {
      error('启动失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
     className="fixed bottom-8 right-8 flex flex-col items-center space-y-1"
    >

      <button
        onClick={handleLaunch}
        disabled={isLoading}
        className={`
        group relative overflow-hidden
        bg-(--color-primary-bg) hover:bg-(--color-primary-hover)/70
        py-4 rounded-(--radius-sm)
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        flex flex-col items-center justify-center min-w-[200px]
        ${className ?? ''}
      `}
      >

        {isLoading ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-light tracking-wide">启动中...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 text-(--color-text-primary)">
              <span className="text-base/2 font-light tracking-wide">启动游戏</span>
            </div>
            <span className="text-xs font-light opacity-90 mt-2.5 
              tracking-wider uppercase text-(--color-text-primary)"
            >
              {selectedGame ? `${selectedGame.name} (${selectedGame.version_id})` : '未选择游戏'}
            </span>
          </>
        )}
      </button>
    </motion.div>
  );
};

export default ActionButton;