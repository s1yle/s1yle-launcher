import { motion } from 'framer-motion';
import { Animated, Reveal } from '@/components/common';
import { BarChart3, TrendingUp, Users, Clock, Server, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DURATION } from '@/utils/animations';
import { useEffect, useState } from 'react';
import { getAnalyticsOverview } from '@/server/sdk.gen';
import type { ModelsAnalyticsOverview } from '@/server/types.gen';

const AdminAnalytics = () => {
  const [overview, setOverview] = useState<ModelsAnalyticsOverview | null>(null);

  useEffect(() => {
    getAnalyticsOverview().then(({ data }) => {
      if (data) setOverview(data);
    });
  }, []);

  const statsCards = [
    {
      title: '总玩家数',
      value: (overview?.total_players ?? 0).toLocaleString(),
      change: null as string | null,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: '今日活跃',
      value: (overview?.daily_active ?? 0).toLocaleString(),
      change: null,
      trend: 'up' as const,
      icon: Activity,
      color: 'green' as const,
    },
    {
      title: '在线率',
      value: overview?.online_rate != null ? `${(overview.online_rate * 100).toFixed(1)}%` : '-',
      change: null,
      trend: 'up' as const,
      icon: Clock,
      color: 'yellow' as const,
    },
    {
      title: '在线服务器',
      value: `${overview?.online_servers ?? 0}/${overview?.total_servers ?? 0}`,
      change: null,
      trend: 'up' as const,
      icon: Server,
      color: 'purple' as const,
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', iconBg: 'bg-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  };

  return (
    <div className="min-h-screen p-8 pt-24">
      <Animated
        fade
        slide="up"
        duration={DURATION.SLOW * 2}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[var(--color-primary)]" />
            数据看板
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            实时监控服务器运营数据
          </p>
        </div>

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

                  {stat.change && (
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
                  )}
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

        <Reveal direction="up" distance={24} duration={0.5} delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="h-64 relative overflow-hidden rounded-xl bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>

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
              <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <span className="text-[var(--color-text-secondary)]">绑定玩家</span>
                <span className="font-medium text-[var(--color-text-primary)]">{overview?.bound_players ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <span className="text-[var(--color-text-secondary)]">存储使用</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {overview?.storage_used != null ? `${(overview.storage_used / 1024 / 1024).toFixed(1)} MB` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <span className="text-[var(--color-text-secondary)]">总上传数</span>
                <span className="font-medium text-[var(--color-text-primary)]">{overview?.total_uploads ?? 0}</span>
              </div>
            </div>
          </Animated>
        </div>
        </Reveal>
      </Animated>
    </div>
  );
};

export default AdminAnalytics;
