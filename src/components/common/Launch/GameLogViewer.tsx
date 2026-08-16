import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Search, Loader2 } from 'lucide-react';
import { getGameLog } from '@/helper/rustInvoke';
import type { GameLogLine, GameLogLevel } from '@/api';
import DropDown, { type DropDownOption } from '../DropDown';
import CheckSwitch from '../CheckSwitch';

/** 日志查看器 Props */
export interface GameLogViewerProps {
  /** 游戏会话唯一 ID */
  gameId: string;
  /** 是否自动轮询增量日志 */
  live?: boolean;
  /** 轮询间隔（ms，默认 1500） */
  pollInterval?: number;
}

/** 单行日志等级配色 */
const LEVEL_OPTIONS: DropDownOption[] = [
  { id: 'all', label: '全部等级' },
  { id: 'info', label: 'INFO' },
  { id: 'warn', label: 'WARN' },
  { id: 'error', label: 'ERROR' },
  { id: 'fatal', label: 'FATAL' },
];

const LEVEL_STYLE: Record<GameLogLevel, string> = {
  info: 'text-[var(--color-text-secondary)]',
  warn: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
  fatal: 'text-[var(--color-error)] font-semibold',
};

/** 游戏日志查看器：增量轮询捕获日志，支持等级/关键词过滤、复制与自动滚底 */
const GameLogViewer = ({ gameId, live = false, pollInterval = 1500 }: GameLogViewerProps) => {
  const [lines, setLines] = useState<GameLogLine[]>([]);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<GameLogLevel | 'all'>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    setLines([]);
    offsetRef.current = 0;
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;

    // 拉取 log 日志
    const fetchBatch = async (from: number) => {
      try {
        const result = await getGameLog(gameId, from);
        if (cancelled) return;
        if (result.lines.length > 0) {
          setLines(prev => {
            const merged = prev.some(l => result.lines[0] && l.text === result.lines[0].text && l.level === result.lines[0].level)
              ? prev
              : [...prev, ...result.lines];
            return merged.length > 5000 ? merged.slice(merged.length - 5000) : merged;
          });
          offsetRef.current = result.offset;
        }
      } catch {
        // 忽略拉取错误，下轮重试
      }
    };

    fetchBatch(offsetRef.current);

    if (!live) return () => { cancelled = true; };
    const timer = setInterval(() => fetchBatch(offsetRef.current), pollInterval);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [gameId, live, pollInterval]);

  useEffect(() => {
    if (autoScroll && boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const filtered = useMemo(() => {
    return lines.filter(l => {
      if (levelFilter !== 'all' && l.level !== levelFilter) return false;
      if (keyword && !l.text.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [lines, keyword, levelFilter]);

  const handleCopy = async () => {
    const text = filtered.map(l => l.text).join('\n');
    if (text) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) overflow-hidden">
      {/* 头部：折叠 + 筛选 + 复制 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          日志
          <span className="text-xs text-[var(--color-text-tertiary)]">{filtered.length} 行</span>
        </button>

        <div className="flex-1" />


        <DropDown
          options={LEVEL_OPTIONS}
          value={LEVEL_OPTIONS.find(o => o.id === levelFilter)}
          onSelect={o => setLevelFilter(o.id as GameLogLevel | 'all')}
          buttonWidth="w-xs"
          openZIndex={1000}
        />


        <button
          onClick={handleCopy}
          title="复制当前筛选结果"
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--color-input)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          复制
        </button>
      </div>

      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/40">

          <div className="flex items-center gap-1 px-2 rounded-md bg-[var(--color-input)] border border-[var(--color-border)]">
            <Search className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="筛选日志"
              className="w-24 py-0.5 text-xs bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
            />
          </div>

          <CheckSwitch
            label='自动滚底'
            checked={autoScroll}
            onChange={e => setAutoScroll(e)}
            className='flex-row'
          />

          {live && <Loader2 className="w-3 h-3 animate-spin text-[var(--color-primary)]" />}
        </div>
      )}

      {!collapsed && (
        <div
          ref={boxRef}
          className="max-h-64 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
        >
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-[var(--color-text-tertiary)]">
              {lines.length === 0 ? '暂无日志' : '没有匹配的日志行'}
            </div>
          ) : (
            filtered.map((line, i) => (
              <div key={i} className={`whitespace-pre-wrap break-all ${LEVEL_STYLE[line.level]}`}>
                {line.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GameLogViewer;