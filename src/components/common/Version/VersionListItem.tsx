import React from 'react';
import { motion } from 'framer-motion';
import { GameVersion } from '../../../helper/rustInvoke';
import { formatDate } from '../../../utils/format';
import StatusBadge from '../Badge/VersionBadge';
import { ExternalLink } from 'lucide-react';
import { listItem, transitions } from '../../../utils/animations';
import { cn } from '@/utils/cn';
import BlockIcon from '../BlockIcon';
import { getVersionTypeBlockIcon } from '@/utils/iconFactory';




/** 版本列表项组件 Props */
export interface VersionListItemProps {
  version: GameVersion;
  wikiUrl?: string;
  onClick: () => void;
  onWikiClick: () => void;
  index?: number;
}

/** 版本列表项组件，显示版本号、类型徽标和 Wiki 链接 */
const VersionListItem = ({
  version,
  onClick,
  onWikiClick,
  index = 0,
}: VersionListItemProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
      <motion.div
        variants={listItem}
        whileTap="tap"
        transition={{ ...transitions.normal, delay: index * 0.02 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer',
          'hover:shadow-sm'
        )}
        style={{
          backgroundColor: isHovered
              ? 'var(--color-primary-10)'
              : 'var(--color-surface-solid)',
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="w-9 h-9 flex items-center justify-center flex-shrink-0 overflow-hidden"
          transition={transitions.spring}
        >
          <BlockIcon
            src={getVersionTypeBlockIcon(version.type)}
            className="w-5 h-5 object-cover"
          />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-text-primary font-medium text-sm truncate">{version.id}</h3>
            <StatusBadge type={version.type} />
          </div>
          <p className="text-text-tertiary text-xs mt-0.5">
            {formatDate(version.releaseTime)}
          </p>
        </div>

        <motion.button
          onClick={(e) => { e.stopPropagation(); onWikiClick(); }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] 
          text-text-secondary hover:text-primary transition-colors 
          rounded hover:bg-surface-hover flex-shrink-0"
          title="Minecraft Wiki"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={transitions.spring}
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Wiki</span>
        </motion.button>

      </motion.div>
  );
};

export default VersionListItem;
