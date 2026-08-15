import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Gamepad2, Square, RotateCcw, Info, Lightbulb, Cpu, MemoryStick, User, FolderOpen, AlertTriangle } from 'lucide-react';
import { getLaunchStatusByKey, stopGame, openFolder, getGameSettings, getGlobalGameSettings } from '@/helper/rustInvoke';
import { AccountInfo, LaunchStatus, type Game, type GameSettings, type LaunchStatusInfo } from '@/api';
import { useAppStore } from '@/stores/appStore';
import { ProgressBar, GameLogViewer, Page, PageSection } from '@/components/common';
import { LAUNCH_HINTS } from '@/utils/launchHints';
import { Z_INDEX } from '@/utils/zIndex';
import pkg from '../../../../package.json';

/** 启动覆盖层 Props */
export interface LaunchingOverlayProps {
  /** 游戏唯一 ID（launch_game 返回值） */
  gameId: string;
  /** 启动的游戏 */
  game: Game;
  /** 启动账户名 */
  accountInfo: AccountInfo;
  /** 返回主页 */
  onExit: () => void;
}

/** 状态轮询间隔（ms，真实进度由后端上报） */
const POLL_INTERVAL = 500;

/** 启动覆盖层：展示后端真实启动进度 / 运行状态 / 关于 / 小贴士 */
const LaunchingOverlay = ({ gameId, game, accountInfo, onExit }: LaunchingOverlayProps) => {
  const [phase, setPhase] = useState<'launching' | 'running' | 'crashed'>('launching');
  const [info, setInfo] = useState<LaunchStatusInfo | null>(null);
  const [stopping, setStopping] = useState(false);
  const [hint, setHint] = useState(() => LAUNCH_HINTS[Math.floor(Math.random() * LAUNCH_HINTS.length)]);
  // 实际生效的设置（未启用独立设置时为全局设置）；加载完成前回退到 store 快照
  const [effectiveSettings, setEffectiveSettings] = useState<GameSettings>(() => game.game_settings ?? {});

  const systemInfo = useAppStore(s => s.systemInfo);
  const stoppedRef = useRef(false);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  // 拉取实际生效的设置（与启动逻辑一致：未启用独立设置时展示全局设置）
  useEffect(() => {
    let cancelled = false;
    Promise.all([getGameSettings(game.name), getGlobalGameSettings()])
      .then(([own, global]) => {
        if (!cancelled) {
          setEffectiveSettings(own.use_game_settings ? own : global);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [game.name]);

  // 随机轮换小贴士
  useEffect(() => {
    const timer = setInterval(() => {
      let next = LAUNCH_HINTS[Math.floor(Math.random() * LAUNCH_HINTS.length)];
      setHint(prev => (next === prev ? LAUNCH_HINTS[(LAUNCH_HINTS.indexOf(prev) + 1) % LAUNCH_HINTS.length] : next));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // 轮询游戏真实状态与进度
  useEffect(() => {
    if (phase === 'crashed') return;
    const poll = async () => {
      try {
        const result = await getLaunchStatusByKey(gameId);
        setInfo(result);
        if (result.status === LaunchStatus.Running) {
          setPhase('running');
        }
        else if (result.status === LaunchStatus.Crashed) {
          setPhase('crashed');
        }
        // 这个分支好像没啥用，不知道是那里的问题，游戏窗口出来后立马关闭游戏之后反而没有出发这个分支
        else if (
          result.status === LaunchStatus.Stopped &&
          phase === 'launching' &&
          !stoppedRef.current
        ) {
          // 启动后立即退出（如进程秒退或被取消），视为异常
          setPhase('crashed');
        }

        else if (result.status === LaunchStatus.Stopped && phase === 'running') {
          // 游戏进程已退出，覆盖层使命完成，自动返回主页
          onExitRef.current();
        }
      } catch (e) {
        // 忽略轮询错误，保持当前状态
        console.warn("轮询错误：", e);
      }
    };
    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [gameId, phase]);

  const progress = phase === 'running' ? 100 : phase === 'crashed' ? 100 : (info?.progress ?? 0);
  const stage = info?.stage || (phase === 'launching' ? '正在准备启动环境' : '');

  const settings = effectiveSettings;
  const javaPath = settings.java_path || 'java';
  const memoryMb = settings.max_memory || 2048;

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopGame(gameId);
      onExit();
    } catch {
      setStopping(false);
    }
  };

  const infoItems = useMemo(
    () => [
      { icon: Gamepad2, label: '版本', value: game.version_id },
      { icon: Cpu, label: 'Java', value: javaPath },
      { icon: MemoryStick, label: '内存', value: `${memoryMb} MB` },
      { icon: User, label: '账户' + " (" + (accountInfo?.account_type || 'offline') + ")", value: accountInfo?.name || 'Steve' },
    ],
    [game.version_id, javaPath, memoryMb, accountInfo?.name]
  );

  return (
    <div
      className="fixed inset-0 overflow-y-auto backdrop-blur bg-(--color-surface)/95 select-none overflow-hidden"
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <div className="h-full min-h-xl flex flex-col items-center justify-center">
        {/* 主卡片 */}
        <Page className="w-full max-w-xl rounded-(--radius-sm) 
          bg-[var(--color-context-bg)] shadow-2xl px-8 py-8"
        >
          {/* 标题 + 加载动画 */}
          <PageSection className="flex flex-col items-center mb-2">
            {phase === 'launching' && (
              <div className="flex gap-1.5 mb-3">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"
                    style={{ animation: `launching-bounce 1.2s ease-in-out ${i * 0.16}s infinite` }}
                  />
                ))}
              </div>
            )}
            <h2 className="text-lg font-light text-[var(--color-text-primary)]">
              {phase === 'launching' && `正在启动 ${game.name}`}
              {phase === 'running' && `${game.name} 运行中`}
              {phase === 'crashed' && `${game.name} 启动失败`}
            </h2>
            <p className="text-sm font-light text-[var(--color-text-secondary)] mt-1">
              {phase === 'launching' && 'Minecraft 正在启动，请稍候'}
              {phase === 'running' && '游戏已进入运行状态，可在此停止或返回'}
              {phase === 'crashed' && '游戏未能正常启动，可查看下方日志排查原因'}
            </p>
          </PageSection>

          {/* 进度区 */}
          {phase !== 'running' && (
            <PageSection className="mb-3">
              <ProgressBar
                progress={progress}
                label={phase === 'launching' ? stage : '启动失败'}
                status={phase === 'crashed' ? 'error' : 'active'}
                variant={phase === 'crashed' ? 'error' : 'default'}
                size="lg"
                showPercentage
                showIcon
              />
              {phase === 'crashed' && (
                <p className="mt-2 text-xs text-[var(--color-error)]">
                  请检查游戏完整性或 Java 配置后重试。
                </p>
              )}
            </PageSection>
          )}

          {/* 崩溃详情 */}
          {phase === 'crashed' && (
            <PageSection className="mb-3 space-y-3">
              {(info?.crash_summary || info?.last_error) && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
                  <div className="min-w-0 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-all">
                    {info?.crash_summary || info?.last_error}
                  </div>
                </div>
              )}
              <GameLogViewer gameId={gameId} />
              <button
                onClick={() => openFolder(game.path)}
                className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                打开游戏目录
              </button>
            </PageSection>
          )}

          {/* 运行中状态 */}
          {phase === 'running' && (
            <PageSection className="mb-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-sm text-[var(--color-success)]">游戏运行中</span>
            </PageSection>
          )}

          {/* 启动信息 */}
          <PageSection className="grid grid-cols-2 gap-3 mb-5">
            {infoItems.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-(--radius-sm) 
                  bg-(--color-surface) px-4 py-3"
              >
                <item.icon className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                <div className="min-w-0">
                  <div className="text-xs text-[var(--color-text-tertiary)]">{item.label}</div>
                  <div className="text-sm text-[var(--color-text-primary)] truncate">{item.value}</div>
                </div>
              </div>
            ))}
          </PageSection>

          {/* 关于 */}
          <PageSection className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)]/60 px-4 py-3 mb-3 text-xs text-[var(--color-text-tertiary)]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              WeCraft! Launcher v{pkg.version}
              {systemInfo?.os && ` · ${systemInfo.os} ${systemInfo.arch ?? ''}`}
            </span>
          </PageSection>

          {/* 你知道吗 */}
          <PageSection className="flex items-start gap-2 rounded-xl bg-[var(--color-surface)]/60 px-4 py-3 mb-6 text-xs text-[var(--color-text-secondary)]">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-warning)]" />
            <span>{hint}</span>
          </PageSection>

          {/* 操作按钮 */}
          <PageSection className="flex justify-center gap-3">
            {phase === 'running' && (
              <button
                onClick={handleStop}
                disabled={stopping}
                className="flex items-center gap-2 px-6 py-2.5 rounded-(--radius-sm) bg-[var(--color-error)]/15 text-[var(--color-error)] hover:bg-[var(--color-error)]/25 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                停止游戏
              </button>
            )}
            {phase === 'crashed' && (
              <button
                onClick={onExit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-(--radius-sm) bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                返回重试
              </button>
            )}
            <button
              onClick={onExit}
              className={`px-6 py-2.5 rounded-(--radius-sm) transition-colors cursor-pointer ${phase === 'running'
                  ? 'bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-surface-hover)'
                  : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                }`}
            >
              返回主页
            </button>
          </PageSection>
        </Page>
      </div>

      <style>{`
        @keyframes launching-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LaunchingOverlay;
