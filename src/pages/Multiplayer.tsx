const Multiplayer = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">多人联机</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          发现和管理多人游戏服务器
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {/* 服务器列表 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">收藏的服务器</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mr-4">
                    <span className="text-white">🌍</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Hypixel Network</h3>
                    <p className="text-gray-300 text-sm">mc.hypixel.net:25565 • 在线: 65,432</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mr-4">
                    <span className="text-white">🏰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Mineplex</h3>
                    <p className="text-gray-300 text-sm">us.mineplex.com:25565 • 在线: 12,345</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center mr-4">
                    <span className="text-white">⚔️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Cubecraft Games</h3>
                    <p className="text-gray-300 text-sm">play.cubecraft.net:25565 • 在线: 8,765</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>
            </div>
          </div>

          {/* 添加服务器 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">添加新服务器</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white font-medium">服务器地址</label>
                <input
                  type="text"
                  placeholder="例如：play.example.com:25565"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium">服务器名称</label>
                <input
                  type="text"
                  placeholder="自定义服务器名称"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>
            <button className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              添加服务器
            </button>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">多人联机功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 服务器发现和收藏</li>
              <li>• 服务器状态监控</li>
              <li>• 快速加入游戏</li>
              <li>• 服务器ping延迟检测</li>
              <li>• 玩家列表查看</li>
              <li>• 服务器历史记录</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Multiplayer;