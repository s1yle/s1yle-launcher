const InstanceList = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">实例列表</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          查看和管理所有Minecraft游戏实例
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {/* 实例列表表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white font-medium">实例名称</th>
                  <th className="text-left py-3 px-4 text-white font-medium">游戏版本</th>
                  <th className="text-left py-3 px-4 text-white font-medium">模组加载器</th>
                  <th className="text-left py-3 px-4 text-white font-medium">最后运行</th>
                  <th className="text-left py-3 px-4 text-white font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-white font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
                        <span className="text-white">⛏️</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">生存服务器</h3>
                        <p className="text-sm text-gray-400">/games/survival</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">1.20.4</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      Fabric
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">2024-01-15</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      正常
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mr-2">
                      启动
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      管理
                    </button>
                  </td>
                </tr>

                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center mr-3">
                        <span className="text-white">🎨</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">创造模式测试</h3>
                        <p className="text-sm text-gray-400">/games/creative</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">1.19.4</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                      Forge
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">2024-01-10</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      正常
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mr-2">
                      启动
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      管理
                    </button>
                  </td>
                </tr>

                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mr-3">
                        <span className="text-white">🧩</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">模组整合包</h3>
                        <p className="text-sm text-gray-400">/games/modpack</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">1.18.2</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      Quilt
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">2024-01-05</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                      需要更新
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mr-2">
                      更新
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      管理
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 批量操作 */}
          <div className="mt-8 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">批量操作</h3>
              <p className="text-gray-300 text-sm">选择多个实例进行操作</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                批量启动
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                批量更新
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                批量删除
              </button>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">实例列表功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 快速启动游戏实例</li>
              <li>• 实例状态监控</li>
              <li>• 批量操作支持</li>
              <li>• 实例搜索和筛选</li>
              <li>• 最近运行历史</li>
              <li>• 性能统计和监控</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceList;