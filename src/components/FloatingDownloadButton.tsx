import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronUp, Check, GripVertical } from 'lucide-react';
import { useDownloadStore } from '../stores/downloadStore';

const FLOATING_BUTTON_SIZE = 56;
const DEFAULT_POSITION = { x: 0, y: 16 };
const PANEL_WIDTH = 380;
const PANEL_MAX_HEIGHT = 480;
const DRAG_THRESHOLD = 5;

interface FloatingDownloadButtonProps {
  className?: string;
}

export const FloatingDownloadButton: React.FC<FloatingDownloadButtonProps> = ({
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { downloadingVersions, completedVersions } = useDownloadStore();

  const downloadingList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter(v => v.status === 'downloading');
  }, [downloadingVersions]);

  const totalProgress = useMemo(() => {
    if (downloadingList.length === 0) return 0;
    const sum = downloadingList.reduce((acc, v) => acc + v.progress, 0);
    return sum / downloadingList.length;
  }, [downloadingList]);

  const hasActiveDownloads = downloadingList.length > 0;
  const shouldShow = hasActiveDownloads;

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, [hasDragged]);

  const handleButtonMouseDown = useCallback((e: React.MouseEvent) => {
    if (isExpanded) return;
    e.preventDefault();
    dragStartRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setIsDragging(true);
    setHasDragged(false);
  }, [position, isExpanded]);

  const handlePanelMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('details')) {
      return;
    }
    e.preventDefault();
    dragStartRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setIsDragging(true);
    setHasDragged(false);
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      setHasDragged(true);
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let newX = dragStartRef.current.x + deltaX;
    let newY = dragStartRef.current.y + deltaY;

    const currentHeight = isExpanded ? PANEL_MAX_HEIGHT : FLOATING_BUTTON_SIZE;
    const halfWidth = FLOATING_BUTTON_SIZE / 2;

    const minX = -windowWidth / 2 + halfWidth;
    const maxX = windowWidth / 2 - halfWidth;
    newX = Math.max(minX, Math.min(maxX, newX));

    const minY = FLOATING_BUTTON_SIZE / 2;
    const maxY = windowHeight - (isExpanded ? PANEL_MAX_HEIGHT : FLOATING_BUTTON_SIZE) - 10;
    newY = Math.max(minY, Math.min(maxY, newY));

    setPosition({ x: newX, y: newY });
  }, [isDragging, isExpanded]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!shouldShow && !isExpanded) {
    return null;
  }

  const buttonContent = (
    <div
      ref={containerRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className="rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
            style={{
              width: PANEL_WIDTH,
              maxHeight: PANEL_MAX_HEIGHT,
              backgroundColor: 'rgba(20, 20, 25, 0.92)',
              border: '1px solid rgba(60, 60, 70, 0.6)',
            }}
            onMouseDown={handlePanelMouseDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none"
              style={{ borderBottom: '1px solid rgba(60, 60, 70, 0.4)' }}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-500" />
                <Download className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-white select-none">
                  下载进度
                </span>
                {downloadingList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs select-none"
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: 'rgb(165, 180, 252)',
                    }}
                  >
                    {downloadingList.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded transition-colors hover:bg-white/10"
              >
                <ChevronUp className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {hasActiveDownloads && (
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(60, 60, 70, 0.4)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">总进度</span>
                  <span className="text-xs font-medium text-white">{totalProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto" style={{ maxHeight: PANEL_MAX_HEIGHT - 140 }}>
              {downloadingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Download className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">暂无下载任务</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {downloadingList.map((item) => (
                    <div
                      key={item.versionId}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(40, 40, 50, 0.8)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white font-medium">Minecraft {item.versionId}</span>
                        <span className="text-xs text-indigo-400">下载中...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-indigo-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-12 text-right">
                          {item.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}

                  {completedVersions.length > 0 && (
                    <details className="group" open>
                      <summary className="flex items-center justify-between p-2 rounded-lg cursor-pointer list-none text-xs text-gray-400"
                        style={{ backgroundColor: 'rgba(30, 30, 35, 0.5)' }}
                      >
                        <span>已完成 ({completedVersions.length})</span>
                        <span className="transform group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-2 space-y-1">
                        {completedVersions.map((version, index) => (
                          <div
                            key={`${version}-${index}`}
                            className="p-2 rounded-lg flex items-center gap-2"
                            style={{
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.2)',
                            }}
                          >
                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                            <span className="text-xs text-green-400 font-medium">Minecraft {version}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            whileDrag={{ scale: 1.1, rotate: 5 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0}
            className="rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
            style={{
              width: FLOATING_BUTTON_SIZE,
              height: FLOATING_BUTTON_SIZE,
              background: 'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(79, 70, 229) 100%)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            }}
            onMouseDown={handleButtonMouseDown}
            onClick={handleButtonClick}
          >
            <Download className="w-6 h-6 text-white pointer-events-none" />

            {downloadingList.length > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-1"
                style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <span className="text-[10px] text-white font-bold leading-none">
                  {downloadingList.length > 9 ? '9+' : downloadingList.length}
                </span>
              </motion.div>
            )}
            
            {hasActiveDownloads && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-indigo-300"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(buttonContent, document.body);
};

export default FloatingDownloadButton;