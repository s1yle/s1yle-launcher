const Download = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-text-primary mb-6 text-center">下载</h1>
        <p className="text-lg text-text-secondary text-center mb-8">
          下载Minecraft游戏版本、模组和资源包
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-info-bg rounded-lg p-6 border border-info text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">游戏版本</h3>
              <p className="text-text-secondary mb-4">下载官方Minecraft版本</p>
              <button className="px-4 py-2 bg-info hover:bg-info text-text-primary rounded-lg transition-colors">
                浏览版本
              </button>
            </div>

            <div className="bg-success-bg rounded-lg p-6 border border-success text-center">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">模组</h3>
              <p className="text-text-secondary mb-4">下载和管理游戏模组</p>
              <button className="px-4 py-2 bg-success hover:bg-success text-text-primary rounded-lg transition-colors">
                浏览模组
              </button>
            </div>

            <div className="bg-primary-bg rounded-lg p-6 border border-primary text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">资源包</h3>
              <p className="text-text-secondary mb-4">下载材质和资源包</p>
              <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-lg transition-colors">
                浏览资源包
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Download;
