const Multiplayer = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">多人联机</h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          发现和管理多人游戏服务器
        </p>
        
        <div className="bg-surface backdrop-blur-sm rounded-xl p-8 border border-border-hover">
          {/* 服务器列表 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">收藏的服务器</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success-bg rounded-lg border border-success">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-success flex items-center justify-center mr-4">
                    <span className="text-text-primary">🌍</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Hypixel Network</h3>
                    <p className="text-text-secondary text-sm">mc.hypixel.net:25565 • 在线: 65,432</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-success hover:bg-success text-text-primary rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-info-bg rounded-lg border border-info">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-info flex items-center justify-center mr-4">
                    <span className="text-text-primary">🏰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Mineplex</h3>
                    <p className="text-text-secondary text-sm">us.mineplex.com:25565 • 在线: 12,345</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-info hover:bg-info text-text-primary rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-bg rounded-lg border border-primary">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-warning flex items-center justify-center mr-4">
                    <span className="text-text-primary">⚔️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Cubecraft Games</h3>
                    <p className="text-text-secondary text-sm">play.cubecraft.net:25565 • 在线: 8,765</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-warning hover:bg-warning text-text-primary rounded-lg transition-colors">
                  加入游戏
                </button>
              </div>
            </div>
          </div>

          {/* 添加服务器 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">添加新服务器</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-text-primary font-medium">服务器地址</label>
                <input
                  type="text"
                  placeholder="例如：play.example.com:25565"
                  className="w-full p-3 bg-surface border border-border-hover rounded-lg text-text-primary placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-text-primary font-medium">服务器名称</label>
                <input
                  type="text"
                  placeholder="自定义服务器名称"
                  className="w-full p-3 bg-surface border border-border-hover rounded-lg text-text-primary placeholder-gray-400"
                />
              </div>
            </div>
            <button className="mt-6 px-6 py-3 bg-primary hover:bg-primary-hover text-text-primary font-medium rounded-lg transition-colors">
              添加服务器
            </button>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-border-hover">
            <h3 className="text-xl font-bold text-text-primary mb-4">多人联机功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-text-secondary">
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