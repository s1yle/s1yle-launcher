import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Loader2, Square, ChevronUp } from 'lucide-react';
import { getCurrentAccount, getGame, getLaunchGames, stopGame, type AccountInfo } from '@/helper/rustInvoke';
import { AccountType, Game, LaunchStatus, type LaunchGameInfo } from '@/api';
import { DURATION, EASING } from '@/utils/animations';
import { Z_INDEX } from '@/utils/zIndex';
import LaunchingOverlay from './LaunchingOverlay';
import { useLoadingAction } from '@/hooks';

/** 游戏轮询间隔（ms） */
const POLL_INTERVAL = 2000;

const STATUS_META: Record<LaunchStatus, { text: string; dot: string }> = {
  [LaunchStatus.Idle]: { text: '空闲', dot: 'bg-[var(--color-text-tertiary)]' },
  [LaunchStatus.Launching]: { text: '启动中', dot: 'bg-[var(--color-warning)] animate-pulse' },
  [LaunchStatus.Running]: { text: '运行中', dot: 'bg-[var(--color-success)] animate-pulse' },
  [LaunchStatus.Crashed]: { text: '已崩溃', dot: 'bg-[var(--color-error)]' },
  [LaunchStatus.Stopped]: { text: '已停止', dot: 'bg-[var(--color-text-tertiary)]' },
};

/** 运行游戏小卡片：左下角展示已启动的游戏，点击放大查看详情 */
const RunningGamesCard = () => {
  const [games, setGames] = useState<LaunchGameInfo[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [shownSession, setShownSession] = useState<{ gameId: string } | null>(null);
  const [shownGame, setShownGame] = useState<Game | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  const loadProfile = useLoadingAction({
    key: 'home:profile',
    action: async () => {
      try {
        const currentAccount: AccountInfo | null = await getCurrentAccount();
        if (currentAccount) {
          setAccountInfo(currentAccount);
        }
      } catch (error) {
        console.error('加载账户信息失败:', error);
      }
    },
  });

  // 启动中：隐藏主页内容，渲染启动覆盖层
  const refresh = async () => {
    try {
      const list = await getLaunchGames();
      setGames(
        list.filter(
          (i) => i.status !== LaunchStatus.Idle && i.status !== LaunchStatus.Stopped
        )
      );
    } catch {
      // 忽略轮询错误，保持上次状态
    }
  };

  useEffect(() => {
    loadProfile();
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // 展示覆盖层：需要游戏详情（Game）与游戏 ID 都就绪
  if (shownSession && shownGame) {
    return (
      <LaunchingOverlay
        gameId={shownSession.gameId}
        game={shownGame}
        accountInfo={accountInfo ?? {
          name: 'Steve',
          uuid: '',
          account_type: AccountType.Offline,
          create_time: '',
          last_login_time: null,
        }}
        onExit={() => setShownSession(null)}
      />
    );
  }

  if (games.length === 0) return null;

  const handleStop = async (gameId: string) => {
    setStoppingId(gameId);
    try {
      await stopGame(gameId);
      await refresh();
    } catch {
      // 忽略停止失败，列表会轮询恢复
    }
    setStoppingId(null);
  };

  const handleGameClick = async (gameId: string) => {
    const inst = games.find((i) => i.game_id === gameId);
    if (!inst) return;
    try {
      const gameName = inst.game_dir.split(/[\\/]/).pop() || inst.game_dir;
      const game = await getGame(gameName);
      if (game) {
        setShownGame(game);
        setShownSession({ gameId });
      }
    } catch {
      // 获取游戏详情失败，忽略点击
    }
  };

  const activeCount = games.filter(
    (i) => i.status === LaunchStatus.Running || i.status === LaunchStatus.Launching
  ).length;
  const first = games[0];

  return (
    <div className="fixed left-8 bottom-8 flex flex-col items-end" style={{ zIndex: Z_INDEX.POPUP }}>
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: DURATION.FAST, ease: EASING.OUT_FLUENT }}
            className="w-80 rounded-2xl border border-[var(--color-context-border)] bg-[var(--color-context-bg)] shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-context-border)]">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  运行中的游戏
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)]">{activeCount} 个</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* 游戏列表 */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
              {games.map((inst) => {
                const meta = STATUS_META[inst.status];
                return (
                  <div
                    key={inst.game_id}
                    className="rounded-xl bg-(--color-surface) hover:bg-(--color-surface-hover)
                      cursor-pointer
                      border border-[var(--color-context-border)] px-3 py-2.5"
                    onClick={() => handleGameClick(inst.game_id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                        <span className="text-sm text-[var(--color-text-primary)] truncate">
                          {inst.version}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)] shrink-0">
                        {meta.text}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                        {inst.username}
                        {inst.pid != null && ` · PID ${inst.pid}`}
                      </div>
                      {(inst.status === LaunchStatus.Running ||
                        inst.status === LaunchStatus.Launching) && (
                          <button
                            onClick={() => handleStop(inst.game_id)}
                            disabled={stoppingId === inst.game_id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {stoppingId === inst.game_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Square className="w-3 h-3" />
                            )}
                            停止
                          </button>
                        )}
                    </div>
                    {inst.last_error && (
                      <div className="mt-1.5 text-xs text-[var(--color-error)] truncate">
                        {inst.last_error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: DURATION.FAST, ease: EASING.OUT_FLUENT }}
            onClick={() => setExpanded(true)}
            className="relative flex items-center gap-2.5 
              rounded-full border border-[var(--color-context-border)] 
              bg-[var(--color-context-bg)] shadow-xl backdrop-blur-xl 
              px-4 py-2.5 cursor-pointer hover:bg-[var(--color-surface)] 
              transition-colors"
          >
            <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-0.5 
              rounded-full bg-[var(--color-success)] text-[10px] 
              leading-4 text-center text-[var(--color-surface)]"
            >
              {activeCount}
            </span>
            <span className="text-sm text-[var(--color-text-primary)] max-w-40 truncate">
              {first ? `${first.version}${games.length > 1 ? ` 等 ${games.length} 个` : ''}` : '游戏运行中'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RunningGamesCard;
