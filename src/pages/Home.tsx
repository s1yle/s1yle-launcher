import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

// 系统信息接口
interface SystemInfo {
  os: string;
  arch: string;
}

const Home = () => {
  const [greeting, setGreeting] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 测试后端通信
  const testBackendCommunication = async () => {
    try {
      setLoading(true);
      setError('');

      // 调用greet命令
      const greetResult = await invoke<string>('greet', { name: '开发者' });
      setGreeting(greetResult);

      // 调用get_system_info命令
      const systemInfoResult = await invoke<SystemInfo>('get_system_info');
      setSystemInfo(systemInfoResult);
    } catch (err) {
      console.error('通信失败:', err);
      setError(`后端通信失败: ${err instanceof Error ? err.message : String(err)}`);
      setGreeting('');
      setSystemInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时测试通信
  useEffect(() => {
    testBackendCommunication();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* 标题区域 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">MC启动器首页</h1>
          <p className="text-lg text-gray-300">欢迎使用MC启动器壳子，这是一个基于Tauri+React+TypeScript+Rust的基础框架</p>
        </div>

        {/* 后端通信测试区域 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">前后端通信测试</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">正在与Rust后端通信...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-300 font-medium">错误: {error}</p>
              <p className="text-red-400/80 text-sm mt-2">请确保Rust后端已正确启动并注册了测试命令</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {/* 问候语结果 */}
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">greet命令结果</h3>
                <p className="text-gray-200 text-lg">{greeting}</p>
              </div>

              {/* 系统信息结果 */}
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">get_system_info命令结果</h3>
                {systemInfo ? (
                  <div className="text-gray-200">
                    <p>系统类型: <span className="font-medium">{systemInfo.os}</span></p>
                    <p>系统架构: <span className="font-medium">{systemInfo.arch}</span></p>
                  </div>
                ) : (
                  <p className="text-gray-400">系统信息加载中...</p>
                )}
              </div>
            </div>
          )}

          {/* 测试按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={testBackendCommunication}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '测试中...' : '重新测试通信'}
            </button>
          </div>
        </div>

        {/* 页面说明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-3">页面说明</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• 这是一个占位页面，用于展示MC启动器的基础框架</li>
              <li>• 左侧侧边栏包含所有功能菜单</li>
              <li>• 顶部Header会根据当前页面自动切换样式</li>
              <li>• 右下角的启动按钮是固定位置</li>
              <li>• 所有页面切换都通过react-router-dom实现</li>
            </ul>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-3">技术栈</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• 前端: React 19 + TypeScript + Tailwind CSS</li>
              <li>• 路由: react-router-dom</li>
              <li>• 后端: Rust (通过Tauri框架)</li>
              <li>• 桌面框架: Tauri 2.0</li>
              <li>• 构建工具: Vite</li>
              <li>• 包管理: pnpm</li>
            </ul>
          </div>
        </div>

        {/* 后续开发提示 */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">后续开发提示</h3>
          <p className="text-gray-300 mb-3">
            当前版本仅为壳子框架，不包含MC启动器的核心业务逻辑。后续可以在此基础上添加：
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
            <li>• 账户登录和管理系统</li>
            <li>• Minecraft实例创建和管理</li>
            <li>• 游戏版本下载和安装</li>
            <li>• 游戏启动和日志监控</li>
            <li>• 模组管理和配置</li>
            <li>• 多人联机功能</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;