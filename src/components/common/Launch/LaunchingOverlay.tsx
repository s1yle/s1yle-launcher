import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gamepad2, Square, RotateCcw, Info, Lightbulb, Cpu, MemoryStick, User } from 'lucide-react';
import { getLaunchStatusByKey, stopGame } from '@/helper/rustInvoke';
import { LaunchStatus, type Game, type LaunchStatusInfo } from '@/api';
import { useAppStore } from '@/stores/appStore';
import { ProgressBar } from '@/components/common';
import { LAUNCH_HINTS } from '@/utils/launchHints';
import { DURATION, EASING } from '@/utils/animations';
import { Z_INDEX } from '@/utils/zIndex';
import pkg from '../../../../package.json';

/** 启动覆盖层 Props */
export interface LaunchingOverlayProps {
  /** 游戏唯一 ID（launch_game 返回值） */
  gameId: string;
  /** 启动的游戏 */
  game: Game;
  /** 启动账户名 */
  username: string;
  /** 返回主页 */
  onExit: () => void;
}

/** 状态轮询间隔（ms，真实进度由后端上报） */
const POLL_INTERVAL = 500;

/** 启动覆盖层：展示后端真实启动进度 / 运行状态 / 关于 / 小贴士 */
const LaunchingOverlay = ({ gameId, game, username, onExit }: LaunchingOverlayProps) => {
  const [phase, setPhase] = useState<'launching' | 'running' | 'crashed'>('launching');
  const [info, setInfo] = useState<LaunchStatusInfo | null>(null);
  const [stopping, setStopping] = useState(false);
  const [hint, setHint] = useState(() => LAUNCH_HINTS[Math.floor(Math.random() * LAUNCH_HINTS.length)]);

  const systemInfo = useAppStore(s => s.systemInfo);
  const stoppedRef = useRef(false);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

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

  const settings = game.game_settings;
  const javaPath = settings?.java_path || 'java';
  const memoryMb = settings?.max_memory || 2048;

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
      { icon: User, label: '账户', value: username },
    ],
    [game.version_id, javaPath, memoryMb, username]
  );

  return (
    <div
      className="fixed inset-0 overflow-y-auto backdrop-blur-xl bg-[var(--color-surface)]/95 select-none"
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-10">
        {/* 主卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.NORMAL, ease: EASING.OUT_FLUENT }}
          className="w-full max-w-2xl rounded-3xl border border-[var(--color-context-border)] bg-[var(--color-context-bg)] shadow-2xl px-8 py-8"
        >
          {/* 标题 + 加载动画 */}
          <div className="flex flex-col items-center mb-8">
            {phase === 'launching' ? (
              <div className="flex gap-1.5 mb-5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"
                    style={{ animation: `launching-bounce 1.2s ease-in-out ${i * 0.16}s infinite` }}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                  phase === 'running'
                    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                    : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'
                }`}
              >
                {phase === 'running' ? <Gamepad2 className="w-7 h-7" /> : <Square className="w-6 h-6" />}
              </div>
            )}
            <h2 className="text-xl font-medium text-[var(--color-text-primary)]">
              {phase === 'launching' && `正在启动 ${game.name}`}
              {phase === 'running' && `${game.name} 运行中`}
              {phase === 'crashed' && `${game.name} 启动失败`}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {phase === 'launching' && 'Minecraft 正在启动，请稍候'}
              {phase === 'running' && '游戏已进入运行状态，可在此停止或返回'}
              {phase === 'crashed' && '游戏未能正常启动，请检查日志后重试'}
            </p>
          </div>

          {/* 进度区 */}
          {phase !== 'running' && (
            <div className="mb-8">
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
            </div>
          )}

          {/* 运行中状态 */}
          {phase === 'running' && (
            <div className="mb-8 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-sm text-[var(--color-success)]">游戏运行中</span>
            </div>
          )}

          {/* 启动信息 */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {infoItems.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 border border-[var(--color-context-border)]"
              >
                <item.icon className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                <div className="min-w-0">
                  <div className="text-xs text-[var(--color-text-tertiary)]">{item.label}</div>
                  <div className="text-sm text-[var(--color-text-primary)] truncate">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 关于 */}
          <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)]/60 px-4 py-3 mb-4 text-xs text-[var(--color-text-tertiary)]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              WeCraft! Launcher v{pkg.version}
              {systemInfo?.os && ` · ${systemInfo.os} ${systemInfo.arch ?? ''}`}
            </span>
          </div>

          {/* 你知道吗 */}
          <div className="flex items-start gap-2 rounded-xl bg-[var(--color-surface)]/60 px-4 py-3 mb-6 text-xs text-[var(--color-text-secondary)]">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-warning)]" />
            <span>{hint}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center gap-3">
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
              className={`px-6 py-2.5 rounded-(--radius-sm) transition-colors cursor-pointer ${
                phase === 'running'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-context-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              返回主页
            </button>
          </div>
        </motion.div>
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
