import { useState, useEffect } from 'react';
import { greet, getSystemInfo, type SystemInfo } from '../../helper/rustInvoke';
import { getErrorMessage } from '../../utils/errorUtils';

/** 启动器说明页面 - 前后端通信测试和功能预览 */
const Hint = () => {

    const [greeting, setGreeting] = useState<string>('');
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [testing, setTesting] = useState(false);

    // 挂载时自动执行一次后端通信测试
    useEffect(() => {
        void testBackendCommunication();
    }, []);

    // 调用 greet / get_system_info 验证后端通信（挂载时与按钮重测共用）
    const testBackendCommunication = async () => {
        setTesting(true);
        try {
            const greetResult = await greet('开发者');
            const systemInfoResult = await getSystemInfo();
            setGreeting(greetResult);
            setSystemInfo(systemInfoResult);
            setError('');
        } catch (e) {
            setError(`后端通信失败: ${getErrorMessage(e)}`);
            setGreeting('');
            setSystemInfo(null);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        <div className="max-w-4xl w-full space-y-8">
            {/* 标题区域 */}
            <div className="text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">MC启动器说明</h1>
            <p className="text-lg text-text-secondary">欢迎使用MC启动器壳子，这是一个基于Tauri+React+TypeScript+Rust的基础框架</p>
            </div>

            {/* 后端通信测试区域 */}
            <div className="bg-surface backdrop-blur-sm rounded-xl p-6 border border-border-hover">
            <h2 className="text-2xl font-bold text-text-primary mb-4">前后端通信测试</h2>
            
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                <p className="text-red-300 font-medium">错误: {error}</p>
                <p className="text-red-400/80 text-sm mt-2">请确保Rust后端已正确启动并注册了测试命令</p>
                </div>
            )}

            {!error && (
                <div className="space-y-4">
                {/* 问候语结果 */}
                <div className="bg-primary-bg border border-indigo-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">greet命令结果</h3>
                    <p className="text-gray-200 text-lg">{greeting}</p>
                </div>

                {/* 系统信息结果 */}
                <div className="bg-success-bg border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">get_system_info命令结果</h3>
                    {systemInfo ? (
                    <div className="text-gray-200">
                        <p>系统类型: <span className="font-medium">{systemInfo.os}</span></p>
                        <p>系统架构: <span className="font-medium">{systemInfo.arch}</span></p>
                    </div>
                    ) : (
                    <p className="text-text-tertiary">系统信息加载中...</p>
                    )}
                </div>
                </div>
            )}

            {/* 测试按钮 */}
            <div className="mt-6 flex justify-center">
                <button
                onClick={testBackendCommunication}
                disabled={testing}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                {testing ? '测试中...' : '重新测试通信'}
                </button>
            </div>
            </div>

            {/* 页面说明 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface backdrop-blur-sm rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-text-primary mb-3">页面说明</h3>
                <ul className="space-y-2 text-text-secondary">
                <li>• 这是一个占位页面，用于展示MC启动器的基础框架</li>
                <li>• 左侧侧边栏包含所有功能菜单</li>
                <li>• 顶部Header会根据当前页面自动切换样式</li>
                <li>• 右下角的启动按钮是固定位置</li>
                <li>• 所有页面切换都通过react-router-dom实现</li>
                </ul>
            </div>

            <div className="bg-surface backdrop-blur-sm rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-text-primary mb-3">技术栈</h3>
                <ul className="space-y-2 text-text-secondary">
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
            <div className="bg-warning-bg border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-text-primary mb-3">后续开发提示</h3>
            <p className="text-text-secondary mb-3">
                当前版本仅为壳子框架，不包含MC启动器的核心业务逻辑。后续可以在此基础上添加：
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-text-secondary">
                <li>• 账户登录和管理系统</li>
                <li>• Minecraft游戏创建和管理</li>
                <li>• 游戏版本下载和安装</li>
                <li>• 游戏启动和日志监控</li>
                <li>• 模组管理和配置</li>
                <li>• 多人联机功能</li>
            </ul>
            </div>

            {/* 账户列表功能说明 */}
            <div className="bg-surface backdrop-blur-sm mt-9 pt-8 border border-border-hover rounded-xl p-6 ">
                <h2 className="text-xl font-bold text-text-primary mb-4">账户管理功能规划</h2>
                <ul className="grid grid-cols-2 md:grid-cols-2 gap-3 text-text-secondary">
                <li>• Microsoft账户登录集成</li>
                <li>• Mojang账户登录（旧版）</li>
                <li>• 离线账户创建和管理</li>
                <li>• 账户切换和自动登录</li>
                <li>• 账户资料同步</li>
                <li>• 皮肤和披风管理</li>
                </ul>
            </div>


            {/* 版本中心功能说明 */}
            <div className="mt-8 pt-8 border-t border-border-hover">
                <h3 className="text-xl font-bold text-text-primary mb-4">版本中心功能规划</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-text-secondary">
                <li>• 创建自定义游戏</li>
                <li>• 导入/导出游戏配置</li>
                <li>• 模组管理界面</li>
                <li>• 资源包和材质包管理</li>
                <li>• Java版本配置</li>
                <li>• 启动参数自定义</li>
                </ul>
            </div>


            {/* 游戏功能说明 */}
            <div className="mt-8 pt-8 border-t border-border-hover">
                <h3 className="text-xl font-bold text-text-primary mb-4">游戏功能规划</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-text-secondary">
                <li>• 快速启动游戏</li>
                <li>• 游戏状态监控</li>
                <li>• 批量操作支持</li>
                <li>• 游戏搜索和筛选</li>
                <li>• 最近运行历史</li>
                <li>• 性能统计和监控</li>
                </ul>
            </div>

            <div className="bg-warning-bg border border-yellow-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-text-primary mb-3">下载管理功能规划</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-text-secondary">
                <li>• 游戏版本下载和安装</li>
                <li>• 模组库集成</li>
                <li>• 资源包和材质包管理</li>
                <li>• 下载队列和进度监控</li>
                <li>• 断点续传支持</li>
                <li>• 版本依赖检查</li>
                </ul>
            </div>

        </div>
        </div>
    );
}


export default Hint;