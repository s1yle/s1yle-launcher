import { motion } from 'framer-motion';
import { Upload, FileText, FolderOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useState, useCallback } from 'react';

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
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
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4"
                  >
                    <Upload className={`w-16 h-16 mx-auto ${isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)'} transition-colors`} />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                    拖拽文件到此处
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    或点击下方按钮选择文件
                  </p>

                  <div className="flex justify-center gap-3 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={simulateUpload}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      选择文件
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4"
                  >
                    <Clock className="w-16 h-16 mx-auto text-blue-400" />
                  </motion.div>

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
                        transition={{ duration: 0.15 }}
                      />
                    </div>

                    <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                      请勿关闭此窗口
                    </p>
                  </div>
                </div>
              )}

              {uploadComplete && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUploadComplete(false)}
                    className="mt-4 px-6 py-2.5 bg-green-500/15 text-green-400 rounded-xl font-medium hover:bg-green-500/25 transition-colors cursor-pointer"
                  >
                    继续上传
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* 最近上传记录 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg"
          >
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-text-secondary)]" />
              最近上传
            </h3>

            <div className="space-y-3">
              {recentUploads.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
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
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-4 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-colors cursor-pointer">
              查看全部上传记录
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUpload;
