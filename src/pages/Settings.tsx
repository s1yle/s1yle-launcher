const Settings = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">设置</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          配置MC启动器参数和系统设置
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 常规设置 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">常规设置</h2>
              
              <div className="space-y-2">
                <label className="text-white font-medium">启动器语言</label>
                <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                  <option value="ko-KR">한국어</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">Java路径</label>
                <input
                  type="text"
                  placeholder="自动检测"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">开机自动启动</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">检查更新</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* 游戏设置 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">游戏设置</h2>
              
              <div className="space-y-2">
                <label className="text-white font-medium">最大内存 (MB)</label>
                <input
                  type="range"
                  min="1024"
                  max="8192"
                  step="512"
                  defaultValue="4096"
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1GB</span>
                  <span>4GB</span>
                  <span>8GB</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">游戏窗口尺寸</label>
                <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="auto">自动适配</option>
                  <option value="800x600">800 × 600</option>
                  <option value="1024x768">1024 × 768</option>
                  <option value="1280x720">1280 × 720</option>
                  <option value="1920x1080">1920 × 1080</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">启用游戏日志</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">显示FPS</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 按钮区域 */}
          <div className="mt-8 pt-8 border-t border-white/20 flex justify-end gap-4">
            <button className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors">
              恢复默认
            </button>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              保存设置
            </button>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">设置功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 启动器外观主题</li>
              <li>• 网络代理配置</li>
              <li>• Java运行时管理</li>
              <li>• 游戏启动参数配置</li>
              <li>• 快捷键自定义</li>
              <li>• 数据备份和恢复</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;