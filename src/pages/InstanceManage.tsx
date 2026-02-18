const InstanceManage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">实例管理</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          创建、编辑和管理您的Minecraft游戏实例
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {/* 实例创建表单 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">创建新实例</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white font-medium">实例名称</label>
                <input
                  type="text"
                  placeholder="例如：我的生存世界"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium">游戏版本</label>
                <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="1.20.4">Minecraft 1.20.4</option>
                  <option value="1.19.4">Minecraft 1.19.4</option>
                  <option value="1.18.2">Minecraft 1.18.2</option>
                  <option value="1.16.5">Minecraft 1.16.5</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium">模组加载器</label>
                <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="vanilla">原版 (Vanilla)</option>
                  <option value="fabric">Fabric</option>
                  <option value="forge">Forge</option>
                  <option value="quilt">Quilt</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium">实例路径</label>
                <input
                  type="text"
                  placeholder="选择保存路径"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>
            <button className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              创建实例
            </button>
          </div>

          {/* 现有实例列表 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">现有实例</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <div>
                  <h3 className="text-lg font-bold text-white">生存服务器</h3>
                  <p className="text-gray-300 text-sm">版本: 1.20.4 • Fabric • 创建时间: 2024-01-15</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    编辑
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    删除
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <div>
                  <h3 className="text-lg font-bold text-white">创造模式测试</h3>
                  <p className="text-gray-300 text-sm">版本: 1.19.4 • Forge • 创建时间: 2024-01-10</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    编辑
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    删除
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <div>
                  <h3 className="text-lg font-bold text-white">模组整合包</h3>
                  <p className="text-gray-300 text-sm">版本: 1.18.2 • Quilt • 创建时间: 2024-01-05</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    编辑
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">实例管理功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 创建自定义游戏实例</li>
              <li>• 导入/导出实例配置</li>
              <li>• 模组管理界面</li>
              <li>• 资源包和材质包管理</li>
              <li>• Java版本配置</li>
              <li>• 启动参数自定义</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceManage;