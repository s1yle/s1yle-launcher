import { BrandLogo } from "@/components/common";
import HandwritingText from "../HandwritingText";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface LoadingSurfaceProps {
  /** 变体：loading 为原有 Suspense 兜底；welcome 为首次进入迎新界面 */
  variant?: "loading" | "welcome";
  /** 迎新标题 */
  title?: string;
  /** 迎新副标题 */
  subtitle?: string;
  /** 迎新简介 */
  description?: string;
  /** 点击“进入启动器”时触发（由调用方关闭迎新界面） */
  onEnter?: () => void;
}

/**
 * 加载表面组件。
 * - loading（默认）：纯 Suspense / loader 阶段兜底加载动画，页面 loader 完成后才挂载页面。
 * - welcome：首次进入启动器的迎新界面，展示原创 Logo 与简介，2 秒后由调用方关闭。
 */
const LoadingSurface = ({
  variant = "loading",
  title = "Welcome to WeCraft!",
  onEnter,
}: LoadingSurfaceProps) => {
  const [showContent, setShowContent] = useState(false);
  const [isHandwritingDone, setIsHandwritingDone] = useState(false);

  // 控制主内容出现（延迟一点点，让背景先就绪）
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (variant === 'welcome') {
    return (
      <motion.div
        data-tauri-drag-region
        className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >

        {/* 主内容容器 */}
        <motion.div
          className="relative flex flex-col items-center text-center px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        >
          {/* 手写文字 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={showContent ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >

            <HandwritingText
              text={title}
              duration={3.0}
              fontSize={64}
              color="var(--color-text-primary)"
              onComplete={() => {
                setIsHandwritingDone(true);
              }}
            />

          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isHandwritingDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4"
          >
            <BrandLogo animated width={200} />
          </motion.div>

          {/* 底部按钮 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={isHandwritingDone ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            onClick={onEnter}
            className="mt-8 text- font-light bg-(--color-bg-primary) px-3 py-2
              hover:bg-(--color-primary-hover)/50 rounded-(--radius-sm)"
          >
            进入启动器
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center select-none">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
      </div>
    </div>
  );
};

export default LoadingSurface;
