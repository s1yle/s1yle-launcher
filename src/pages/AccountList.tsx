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

        </div>
      </div>
    </div>
  );
};

export default AccountList;