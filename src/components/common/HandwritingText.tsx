import { useEffect, useState } from 'react';
import { parse } from 'opentype.js';

export interface HandwritingTextProps {
  /** 要手写绘制的文本 */
  text: string;
  /** 整体书写时长（秒），默认 2.4 */
  duration?: number;
  /** 墨色 */
  color?: string;
  /** 字号（px），默认 64 */
  fontSize?: number;
  /** 手写字体文件路径（需为 ttf/otf，woff2 不被 opentype.js 解析） */
  fontUrl?: string;
  /** 书写完成后的回调 */
  onComplete?: () => void;
  /** 字母之间的重叠比例（0=紧挨着，0.5=下一笔在上笔未完成过半时就开始），默认 0.45 */
  letterOverlap?: number;
  /** 自定义类名 */
  className?: string;
}

interface Glyph {
  d: string;
  delay: number;
  draw: number;
  fillDelay: number;
}

interface Trace {
  glyphs: Glyph[];
  width: number;
  height: number;
}

let fontCache: unknown = null;
let fontLoading: Promise<unknown> | null = null;

function loadFont(url: string): Promise<unknown> {
  if (fontCache) return Promise.resolve(fontCache);
  if (!fontLoading) {
    fontLoading = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`font fetch failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        const font = parse(buf);
        fontCache = font;
        return font;
      })
      .catch((err) => {
        fontLoading = null;
        throw err;
      });
  }
  return fontLoading;
}

const HandwritingText = ({
  text,
  duration = 2.4,
  color = 'currentColor',
  fontSize = 64,
  fontUrl = '/fonts/handwriting.ttf',
  onComplete,
  letterOverlap = 0.45,
  className = '',
}: HandwritingTextProps) => {
  const [trace, setTrace] = useState<Trace | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFont(fontUrl)
      .then((font) => {
        if (cancelled) return;
        const f = font as {
          unitsPerEm: number;
          ascender: number;
          descender: number;
          getPath: (t: string, x: number, y: number, s: number) => { toPathData: (d?: number) => string };
          getAdvanceWidth: (t: string, s: number) => number;
        };
        const scale = fontSize / f.unitsPerEm;
        const pad = fontSize * 0.12;
        const chars = text.split('');
        const drawable = chars.filter((ch) => ch !== ' ' && ch !== '\n');
        const totalAdvance = chars.reduce((sum, ch) => sum + f.getAdvanceWidth(ch, fontSize), 0);
        const innerHeight = (f.ascender - f.descender) * scale;
        const width = totalAdvance + pad * 2;
        const height = innerHeight + pad * 2;
        const baseline = f.ascender * scale + pad;

        const n = Math.max(1, drawable.length);
        const drawTime = Math.max(duration / n, 0.6);
        const startInterval = drawTime * (1 - Math.min(0.9, Math.max(0, letterOverlap)));

        const items: Glyph[] = [];
        let x = pad;
        let idx = 0;
        for (const ch of chars) {
          const adv = f.getAdvanceWidth(ch, fontSize);
          if (ch !== ' ' && ch !== '\n') {
            const d = f.getPath(ch, x, baseline, fontSize).toPathData(2);
            const delay = idx * startInterval;
            const draw = drawTime;
            items.push({ d, delay, draw, fillDelay: delay + draw * 0.75 });
            idx += 1;
          }
          x += adv;
        }
        setTrace({ glyphs: items, width, height });
      })
      .catch(() => {
        onComplete?.();
      });
    return () => {
      cancelled = true;
    };
  }, [text, fontSize, fontUrl, duration, letterOverlap]);

  useEffect(() => {
    if (!trace) return;
    const last = trace.glyphs[trace.glyphs.length - 1];
    const total = (last.fillDelay + 0.4) * 1000 + 200;
    const timer = setTimeout(() => onComplete?.(), total);
    return () => clearTimeout(timer);
  }, [trace, onComplete]);

  if (trace) {
    return (
      <span className={className} style={{ display: 'inline-block', lineHeight: 1 }}>
        <svg
          width={trace.width}
          height={trace.height}
          viewBox={`0 0 ${trace.width} ${trace.height}`}
          style={{ display: 'block', overflow: 'visible' }}
          role="img"
          aria-label={text}
        >
          {trace.glyphs.map((g, i) => (
            <path
              key={i}
              d={g.d}
              fill="transparent"
              stroke={color}
              strokeWidth={fontSize * 0.045}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `hwDraw ${g.draw}s ease ${g.delay}s forwards, hwFill 0.4s ease ${g.fillDelay}s forwards`,
              }}
            />
          ))}
        </svg>
        <style>{`
          @keyframes hwDraw { to { stroke-dashoffset: 0; } }
          @keyframes hwFill { to { fill: ${color}; } }
        `}</style>
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        fontFamily: "'Dancing Script', 'Segoe Script', 'Comic Sans MS', cursive",
        fontSize,
        color,
        display: 'inline-block',
        whiteSpace: 'pre',
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  );
};

export default HandwritingText;
