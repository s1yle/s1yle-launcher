import { motion } from 'framer-motion';
import { Animated } from '@/components/common';
import { Server, Plus, MoreVertical, Settings, Users, Activity } from 'lucide-react';
import { DURATION, microInteractions } from '@/utils/animations';

const AdminServers = () => {
  const mockServers = [
    { id: 1, name: '生存服务器', status: 'online', players: 12/20, version: '1.20.4' },
    { id: 2, name: '创造服务器', status: 'online', players: 5/10, version: '1.20.4' },
    { id: 3, name: '小游戏服务器', status: 'offline', players: 0/16, version: '1.19.2' },
  ];

  return (
    <div className="min-h-screen p-8 pt-24">
      <Animated
        fade
        slide="up"
        duration={DURATION.SLOW * 2}
        className="max-w-7xl mx-auto"
      >
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            服务器管理
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            管理你的所有Minecraft服务器
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <motion.button
              whileHover={microInteractions.secondaryButtonHover}
              whileTap={microInteractions.secondaryButtonTap}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              添加服务器
            </motion.button>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Activity className="w-4 h-4" />
            <span>{mockServers.filter(s => s.status === 'online').length}/{mockServers.length} 个服务器在线</span>
          </div>
        </div>

        {/* 服务器列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServers.map((server, index) => (
            <Animated
              key={server.id}
              fade
              slide="up"
              delay={index * DURATION.FAST}
              duration={DURATION.SLOW + 0.2}
              className="group bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl transition-all cursor-pointer"
            >
              {/* 服务器头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    server.status === 'online' 
                      ? 'bg-[var(--color-success)]/15' 
                      : 'bg-[var(--color-text-disabled)]/15'
                  }`}>
                    <Server className={`w-6 h-6 ${
                      server.status === 'online' 
                        ? 'text-[var(--color-success)]' 
                        : 'text-[var(--color-text-disabled)]'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {server.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{server.version}</p>
                  </div>
                </div>

                <button className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              {/* 状态信息 */}
              <div className="space-y-3">
                {/* 在线状态 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">状态</span>
                  <span className={`font-medium ${
                    server.status === 'online' 
                      ? 'text-[var(--color-success)]' 
                      : 'text-[var(--color-text-disabled)]'
                  }`}>
                    {server.status === 'online' ? '运行中' : '离线'}
                  </span>
                </div>

                {/* 玩家数量 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      在线玩家
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {Math.floor(server.players * 20)}/20
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${server.players * 100}%` }}
                      transition={{ delay: DURATION.SLOW + index * DURATION.FAST, duration: DURATION.SLOW * 2 }}
                    />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-5 pt-4 border-t border-[var(--color-border)]/30 flex gap-2">
                <button 
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                    server.status === 'online'
                      ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20'
                      : 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
                  }`}
                >
                  {server.status === 'online' ? '停止' : '启动'}
                </button>
                <button className="px-4 py-2 rounded-lg font-medium text-sm bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  设置
                </button>
              </div>
            </Animated>
          ))}
        </div>
      </Animated>
    </div>
  );
};

export default AdminServers;
