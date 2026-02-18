const AccountList = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">账户列表</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          这是账户列表页面，后续可以在此处添加账户管理功能
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 示例账户卡片 */}
            <div className="bg-indigo-500/20 rounded-lg p-6 border border-indigo-500/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-white">主账户</h3>
                  <p className="text-gray-300 text-sm">在线</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">这是您的主要Minecraft账户</p>
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                切换账户
              </button>
            </div>

            <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-white">备用账户</h3>
                  <p className="text-gray-300 text-sm">离线</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">备用游戏账户</p>
              <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                登录
              </button>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">➕</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-white">添加新账户</h3>
                  <p className="text-gray-300 text-sm">点击添加</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">添加新的Minecraft账户</p>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                添加账户
              </button>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">账户管理功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• Microsoft账户登录集成</li>
              <li>• Mojang账户登录（旧版）</li>
              <li>• 离线账户创建和管理</li>
              <li>• 账户切换和自动登录</li>
              <li>• 账户资料同步</li>
              <li>• 皮肤和披风管理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountList;