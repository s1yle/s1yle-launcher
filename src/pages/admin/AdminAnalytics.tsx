import { motion } from 'framer-motion';
import { Page, PageSection, CountUp } from '@/components/common';
import { BarChart3, TrendingUp, Users, Clock, Server, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DURATION, EASING } from '@/utils/animations';
import { useEffect, useState } from 'react';
import { getAnalyticsOverview } from '@/server/sdk.gen';
import type { ModelsAnalyticsOverview } from '@/server/types.gen';

/** 服主后台 - 数据看板页面 */
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
      value: overview?.total_players ?? 0,
      change: null as string | null,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: '今日活跃',
      value: overview?.daily_active ?? 0,
      change: null,
      trend: 'up' as const,
      icon: Activity,
      color: 'green' as const,
    },
    {
      title: '在线率',
      value: overview?.online_rate != null ? Math.round(overview.online_rate * 1000) / 10 : null,
      change: null,
      trend: 'up' as const,
      icon: Clock,
      color: 'yellow' as const,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      title: '在线服务器',
      value: overview?.online_servers ?? 0,
      change: null,
      trend: 'up' as const,
      icon: Server,
      color: 'purple' as const,
      format: (v: number) => `${v}/${overview?.total_servers ?? 0}`,
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', iconBg: 'bg-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  };

  return (
    <Page className="min-h-screen p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <PageSection className="mb-8">
          <PageTitleRow />
        </PageSection>

        <PageSection className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat) => {
              const colors = colorMap[stat.color];
              const IconComponent = stat.icon;

              return (
                <div key={stat.title} className="group bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl transition-all">
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
                    {stat.value != null ? (
                      <CountUp
                        value={stat.value}
                        className="text-3xl font-bold text-[var(--color-text-primary)]"
                        format={stat.format}
                      />
                    ) : (
                      <p className="text-3xl font-bold text-[var(--color-text-primary)]">-</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PageSection>

        <PageSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg">
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
                    transition={{ delay: DURATION.SLOW * 2, duration: 1.5, ease: EASING.OUT_FLUENT }}
                  />

                  <motion.path
                    d="M 0,150 Q 50,120 100,130 T 200,100 T 300,80 T 400,60 L 400,200 L 0,200 Z"
                    fill="url(#chartGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: DURATION.SLOW * 2 + DURATION.MEDIUM, duration: 0.8, ease: EASING.OUT_FLUENT }}
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
            </div>

            <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/50 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[var(--color-text-primary)]">服务器状态</h3>
                <Server className="w-5 h-5 text-[var(--color-primary)]" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                  <span className="text-[var(--color-text-secondary)]">绑定玩家</span>
                  <CountUp value={overview?.bound_players ?? 0} className="font-medium text-[var(--color-text-primary)]" />
                </div>
                <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                  <span className="text-[var(--color-text-secondary)]">存储使用</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {overview?.storage_used != null ? `${(overview.storage_used / 1024 / 1024).toFixed(1)} MB` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                  <span className="text-[var(--color-text-secondary)]">总上传数</span>
                  <CountUp value={overview?.total_uploads ?? 0} className="font-medium text-[var(--color-text-primary)]" />
                </div>
              </div>
            </div>
          </div>
        </PageSection>
      </div>
    </Page>
  );
};

const PageTitleRow = () => (
  <>
    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
      <BarChart3 className="w-8 h-8 text-[var(--color-primary)]" />
      数据看板
    </h1>
    <p className="text-[var(--color-text-secondary)]">
      实时监控服务器运营数据
    </p>
  </>
);

export default AdminAnalytics;