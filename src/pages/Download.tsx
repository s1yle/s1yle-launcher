const Download = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">下载</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          下载Minecraft游戏版本、模组和资源包
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30 text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-white mb-2">游戏版本</h3>
              <p className="text-gray-300 mb-4">下载官方Minecraft版本</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                浏览版本
              </button>
            </div>

            <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30 text-center">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-xl font-bold text-white mb-2">模组</h3>
              <p className="text-gray-300 mb-4">下载和管理游戏模组</p>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                浏览模组
              </button>
            </div>

            <div className="bg-purple-500/20 rounded-lg p-6 border border-purple-500/30 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-2">资源包</h3>
              <p className="text-gray-300 mb-4">下载材质和资源包</p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                浏览资源包
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-3">下载管理功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 游戏版本下载和安装</li>
              <li>• 模组库集成</li>
              <li>• 资源包和材质包管理</li>
              <li>• 下载队列和进度监控</li>
              <li>• 断点续传支持</li>
              <li>• 版本依赖检查</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
