import { motion } from 'framer-motion';
import { Animated } from '@/components/common';
import { Upload, FileText, FolderOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useState, useCallback } from 'react';
import { DURATION, microInteractions, transitions } from '@/utils/animations';

const AdminUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const recentUploads = [
    { name: 'server.properties', size: '2.4 KB', time: '2分钟前', status: 'success' },
    { name: 'config.yml', size: '15.8 KB', time: '1小时前', status: 'success' },
    { name: 'plugins/', size: '125 MB', time: '昨天', status: 'success' },
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 模拟上传
    setIsUploading(true);
    setUploadComplete(false);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  }, []);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadComplete(false);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 250);
  };

  return (
    <div className="min-h-screen p-8 pt-24">
      <Animated
        fade
        slide="up"
        duration={DURATION.SLOW * 2}
        className="max-w-7xl mx-auto"
      >
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
            <Upload className="w-8 h-8 text-[var(--color-primary)]" />
            配置上传
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            上传服务器配置文件、插件和资源包
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 上传区域 */}
          <Animated
            fade
            slide="left"
            delay={DURATION.MEDIUM}
            duration={DURATION.SLOW * 2}
            className="lg:col-span-2"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                ${isDragging 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.02]' 
                  : uploadComplete
                    ? 'border-green-500 bg-green-500/5'
                    : isUploading
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]'
                }
              `}
            >
              {!isUploading && !uploadComplete && (
                <>
                  <Animated
                    fade
                    scale={0.9}
                    className="mb-4"
                  >
                    <Upload className={`w-16 h-16 mx-auto ${isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)'} transition-colors`} />
                  </Animated>

                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    拖拽文件到此处
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    或点击下方按钮选择文件
                  </p>

                  <div className="flex justify-center gap-3 mb-4">
                    <motion.button
                      whileHover={microInteractions.secondaryButtonHover}
                      whileTap={microInteractions.secondaryButtonTap}
                      onClick={simulateUpload}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      选择文件
                    </motion.button>

                    <motion.button
                      whileHover={microInteractions.secondaryButtonHover}
                      whileTap={microInteractions.secondaryButtonTap}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-xl font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    >
                      <FolderOpen className="w-5 h-5" />
                      选择文件夹
                    </motion.button>
                  </div>

                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    支持 .properties .yml .json .jar 等格式，单文件最大 500MB
                  </p>
                </>
              )}

              {isUploading && (
                <div className="space-y-6">
                  <Animated
                    fade
                    scale={0.8}
                    className="mb-4"
                  >
                    <Clock className="w-16 h-16 mx-auto text-blue-400" />
                  </Animated>

                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    正在上传...
                  </h3>

                  <div className="max-w-md mx-auto space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">进度</span>
                      <span className="font-medium text-[var(--color-primary)]">{Math.round(uploadProgress)}%</span>
                    </div>

                    <div className="h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                        transition={transitions.normal}
                      />
                    </div>

                    <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                      请勿关闭此窗口
                    </p>
                  </div>
                </div>
              )}

              {uploadComplete && (
                <Animated
                  fade
                  scale={0.8}
                  className="space-y-4"
                >
                  <CheckCircle className="w-20 h-20 mx-auto text-green-400" />

                  <h3 className="text-2xl font-bold text-green-400">
                    上传成功！
                  </h3>

                  <p className="text-[var(--color-text-secondary)]">
                    文件已成功上传到服务器
                  </p>

                  <motion.button
                    whileHover={microInteractions.secondaryButtonHover}
                    whileTap={microInteractions.secondaryButtonTap}
                    onClick={() => setUploadComplete(false)}
                    className="mt-4 px-6 py-2.5 bg-green-500/15 text-green-400 rounded-xl font-medium hover:bg-green-500/25 transition-colors cursor-pointer"
                  >
                    继续上传
                  </motion.button>
                </Animated>
              )}
            </div>
          </Animated>

          {/* 最近上传记录 */}
          <Animated
            fade
            slide="right"
            delay={DURATION.SLOW + DURATION.FAST}
            duration={DURATION.SLOW * 2}
            className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg"
          >
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-text-secondary)]" />
              最近上传
            </h3>

            <div className="space-y-3">
              {recentUploads.map((file, index) => (
                <Animated
                  key={file.name}
                  fade
                  slide="left"
                  delay={DURATION.SLOW + DURATION.MEDIUM + index * DURATION.FAST}
                  duration={DURATION.NORMAL}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-primary)]/10 transition-colors mt-0.5">
                    <FileText className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{file.size} · {file.time}</p>
                  </div>

                  {file.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                  )}
                </Animated>
              ))}
            </div>

            <button className="w-full mt-4 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-colors cursor-pointer">
              查看全部上传记录
            </button>
          </Animated>
        </div>
      </Animated>
    </div>
  );
};

export default AdminUpload;
