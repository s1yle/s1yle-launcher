import { motion } from 'framer-motion';
import { Animated, Reveal } from '@/components/common';
import { BarChart3, TrendingUp, Users, Clock, Server, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DURATION } from '@/utils/animations';

const AdminAnalytics = () => {
  const statsCards = [
    {
      title: '总玩家数',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: '今日活跃',
      value: '567',
      change: '+8.2%',
      trend: 'up',
      icon: Activity,
      color: 'green'
    },
    {
      title: '平均在线时长',
      value: '2.5h',
      change: '-3.1%',
      trend: 'down',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: '服务器运行时间',
      value: '99.9%',
      change: '+0.2%',
      trend: 'up',
      icon: Server,
      color: 'purple'
    }
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', iconBg: 'bg-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/20' }
  };

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
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[var(--color-primary)]" />
            数据看板
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            实时监控服务器运营数据
          </p>
        </div>

        {/* 统计卡片 */}
        <Reveal direction="up" distance={20} duration={0.5} margin="-20px">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const colors = colorMap[stat.color];
            const IconComponent = stat.icon;
            
            return (
              <Animated
                key={stat.title}
                fade
                slide="up"
                delay={index * DURATION.FAST}
                duration={DURATION.SLOW + 0.2}
                className="group bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                    <IconComponent className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trend === 'up' 
                      ? 'bg-green-500/15 text-green-400' 
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                </div>
              </Animated>
            );
          })}
        </div>
        </Reveal>

        {/* 图表区域 */}
        <Reveal direction="up" distance={24} duration={0.5} delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 玩家趋势图 */}
          <Animated
            fade
            slide="left"
            delay={DURATION.SLOW + DURATION.FAST}
            duration={DURATION.SLOW * 2}
            className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--color-text-primary)]">玩家趋势</h3>
              <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
            </div>

            {/* 模拟图表区域 */}
            <div className="h-64 relative overflow-hidden rounded-xl bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* 模拟折线图 */}
                <motion.path
                  d="M 0,150 Q 50,120 100,130 T 200,100 T 300,80 T 400,60"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: DURATION.SLOW * 2, duration: 1.5 }}
                />
                
                <motion.path
                  d="M 0,150 Q 50,120 100,130 T 200,100 T 300,80 T 400,60 L 400,200 L 0,200 Z"
                  fill="url(#chartGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: DURATION.SLOW * 2 + DURATION.MEDIUM, duration: 0.8 }}
                />
              </svg>

              {/* X轴标签 */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 text-xs text-[var(--color-text-tertiary)]">
                <span>周一</span>
                <span>周二</span>
                <span>周三</span>
                <span>周四</span>
                <span>周五</span>
                <span>周六</span>
                <span>周日</span>
              </div>
            </div>
          </Animated>

          {/* 服务器状态 */}
          <Animated
            fade
            slide="right"
            delay={DURATION.SLOW + DURATION.MEDIUM}
            duration={DURATION.SLOW * 2}
            className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--color-text-primary)]">服务器状态</h3>
              <Server className="w-5 h-5 text-[var(--color-primary)]" />
            </div>

            <div className="space-y-4">
              {[
                { name: '生存服务器', cpu: 45, memory: 62, status: 'healthy' },
                { name: '创造服务器', cpu: 28, memory: 41, status: 'healthy' },
                { name: '小游戏服务器', cpu: 67, memory: 78, status: 'warning' },
              ].map((server, index) => (
                <Animated
                  key={server.name}
                  fade
                  slide="left"
                  delay={DURATION.SLOW * 2 + index * DURATION.FAST}
                  duration={DURATION.NORMAL}
                  className="p-4 rounded-xl bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[var(--color-text-primary)]">{server.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      server.status === 'healthy' 
                        ? 'bg-green-500/15 text-green-400' 
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {server.status === 'healthy' ? '正常' : '警告'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--color-text-secondary)] w-16">CPU</span>
                      <div className="flex-1 h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${server.cpu}%` }}
                          transition={{ delay: DURATION.SLOW * 2 + DURATION.MEDIUM + index * DURATION.FAST, duration: DURATION.SLOW * 2 }}
                        />
                      </div>
                      <span className="text-[var(--color-text-tertiary)] w-10 text-right">{server.cpu}%</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--color-text-secondary)] w-16">内存</span>
                      <div className="flex-1 h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${server.memory}%` }}
                          transition={{ delay: DURATION.SLOW * 3 + index * DURATION.FAST, duration: DURATION.SLOW * 2 }}
                        />
                      </div>
                      <span className="text-[var(--color-text-tertiary)] w-10 text-right">{server.memory}%</span>
                    </div>
                  </div>
                </Animated>
              ))}
            </div>
          </Animated>
        </div>
        </Reveal>
      </Animated>
    </div>
  );
};

export default AdminAnalytics;
