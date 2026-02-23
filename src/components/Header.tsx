import { useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';

interface HeaderProps {
  type: 'main' | 'sub';
  title: string;
}

const Header = ({ type, title }: HeaderProps) => {
  const navigate = useNavigate();

  // 窗口控制函数
  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('最小化窗口失败:', error);
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('关闭窗口失败:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <header 
      className="bg-indigo-500 text-white h-16 flex items-center justify-between px-6"
      data-tauri-drag-region
    >
      {/* 左侧区域 */}
      <div className="flex items-center gap-4" data-tauri-drag-region>
        {type === 'main' ? (
          // Main类型：Logo + 标题
          <>
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">MC</span>
            </div>
            <h1 className="text-xl font-bold" data-tauri-drag-region>{title}</h1>
          </>
        ) : (
          // Sub类型：返回箭头 + 标题
          <>
            <motion.button
              onClick={handleBackToHome}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="返回首页"
              whileHover={{ 
                scale: 1.1,       // 悬停时轻微放大
                x: -2             // 悬停时向左轻微偏移
              }}
              whileTap={{ scale: 0.95 }}  // 点击时轻微缩小
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </motion.svg>
            </motion.button>
            <h2 className="text-xl font-bold" data-tauri-drag-region>{title}</h2>
          </>
        )}
      </div>

      {/* 右侧窗口控制按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="最小化"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 12H4"
            />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="关闭"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
