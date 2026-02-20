
const Home = () => {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* 标题区域 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">MC启动器首页</h1>
          <p className="text-lg text-gray-300">请在启动器说明中查看详细说明！</p>
        </div>
      </div>
    </div>
  );
};

export default Home;