const Feedback = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">反馈与群组</h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          提交反馈、加入社区群组和获取帮助
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 反馈提交 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">提交反馈</h2>
              
              <div className="space-y-2">
                <label className="text-white font-medium">反馈类型</label>
                <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="bug">错误报告</option>
                  <option value="feature">功能建议</option>
                  <option value="improvement">改进建议</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">标题</label>
                <input
                  type="text"
                  placeholder="简要描述问题或建议"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">详细描述</label>
                <textarea
                  rows={6}
                  placeholder="请详细描述您遇到的问题或建议..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium">联系方式（可选）</label>
                <input
                  type="text"
                  placeholder="邮箱或Discord用户名"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <button className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                提交反馈
              </button>
            </div>

            {/* 社区群组 */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">社区群组</h2>
              
              <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mr-4">
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Discord 社区</h3>
                    <p className="text-gray-300 text-sm">加入我们的Discord服务器</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  加入 Discord
                </button>
              </div>

              <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📚</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">GitHub 仓库</h3>
                    <p className="text-gray-300 text-sm">查看源代码和提交Issue</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  访问 GitHub
                </button>
              </div>

              <div className="bg-purple-500/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📖</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">文档和教程</h3>
                    <p className="text-gray-300 text-sm">查看使用文档和教程</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  查看文档
                </button>
              </div>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">反馈与社区功能规划</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <li>• 在线反馈提交系统</li>
              <li>• 社区讨论板块</li>
              <li>• 常见问题解答（FAQ）</li>
              <li>• 用户指南和教程</li>
              <li>• 错误日志自动收集</li>
              <li>• 更新公告推送</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;