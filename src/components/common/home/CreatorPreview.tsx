import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { SettingsPanel, BlockIcon } from '@/components/common';
import { BLOCK_ICONS } from '@/utils/iconFactory';
import { DURATION, EASING } from '@/utils/animations';

const COMING_SOON_ITEMS = [
  {
    icon: BLOCK_ICONS.goldBlock,
    title: '社区服务器',
    description: '免费浏览并加入社区服务器',
  },
  {
    icon: BLOCK_ICONS.redstoneLamp,
    title: '服主数据看板',
    description: '实时查看服务器运行状态与玩家数据',
  },
  {
    icon: BLOCK_ICONS.furnace,
    title: '服主后台',
    description: '一键切换服主身份，管理白名单与资源包',
  },
];

/**
 * 创作者身份预览面板。
 * 当切换到创作者（creator）身份时展示，告知用户云端模块（社区服务器 / 服主身份）将在后续版本开放。
 */
const CreatorPreview = () => {
  return (
    <motion.div
      className="w-full max-w-3xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.MEDIUM, ease: EASING.OUT_FLUENT }}
    >
      <SettingsPanel label="创作者身份">
        <SettingsPanel.Item>
          <div className="flex items-center gap-4">
            <BlockIcon src={BLOCK_ICONS.anvil} w={10} h={10} alt="creator" className="opacity-90" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-light text-(--color-text-primary)">
                创作者中心
              </div>
              <div className="text-xs text-(--color-text-tertiary)">
                社区服务器与服主身份正在开发中，敬请期待后续版本
              </div>
            </div>
          </div>
        </SettingsPanel.Item>
      </SettingsPanel>

      <SettingsPanel label="即将上线">
        {COMING_SOON_ITEMS.map((item) => (
          <SettingsPanel.Item key={item.title}>
            <div className="flex items-center gap-3">
              <BlockIcon src={item.icon} w={6} h={6} alt={item.title} className="opacity-90" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-light text-(--color-text-primary)">
                  {item.title}
                </div>
                <div className="text-xs text-(--color-text-tertiary)">
                  {item.description}
                </div>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-(--color-primary)/15 text-(--color-primary)">
                敬请期待
              </span>
            </div>
          </SettingsPanel.Item>
        ))}
      </SettingsPanel>

      <p className="flex items-center justify-center gap-1.5 text-xs text-(--color-text-tertiary)">
        <CalendarClock className="w-3.5 h-3.5" />
        云端模块 · 后续版本开放
      </p>
    </motion.div>
  );
};

export default CreatorPreview;