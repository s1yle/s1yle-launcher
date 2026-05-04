import React from 'react';
import { motion } from 'framer-motion';
import { GameVersion } from '../../helper/rustInvoke';
import { formatDate } from '../../utils/format';
import StatusBadge from './StatusBadge';
import { ExternalLink, Package, CheckCircle, Loader2 } from 'lucide-react';
import { listItem, transitions } from '../../utils/animations';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface VersionListItemProps {
  version: GameVersion;
  installed: boolean;
  wikiUrl?: string;
  downloading?: boolean;
  onClick: () => void;
  onWikiClick: () => void;
  onDownload?: () => void;
  onDeploy?: () => void;
  isDeploying?: boolean;
  deployProgress?: number;
  index?: number;
}

const VersionListItem: React.FC<VersionListItemProps> = ({
  version,
  installed,
  downloading,
  onClick,
  onWikiClick,
  onDownload,
  onDeploy,
  isDeploying,
  deployProgress,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      variants={listItem}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      transition={{ ...transitions.normal, delay: index * 0.02 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        installed 
          ? 'shadow-sm shadow-success/10' 
          : 'hover:shadow-sm'
      )}
      style={{
        backgroundColor: installed 
          ? 'rgba(34, 197, 94, 0.08)' 
          : isHovered 
            ? 'rgba(99, 102, 241, 0.1)' 
            : 'var(--color-surface-solid)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="w-9 h-9 bg-primary-bg rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={transitions.spring}
      >
        <Package className="w-4 h-4 text-primary" />
      </motion.div>

      <div className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-center gap-2">
          <h3 className="text-text-primary font-medium text-sm truncate">{version.id}</h3>
          <StatusBadge type={version.type_} />
          {installed && (
            <motion.span 
              className="px-1.5 py-0.5 text-[10px] rounded bg-success-bg text-success border border-success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={transitions.spring}
            >
              已安装
            </motion.span>
          )}
        </div>
        <p className="text-text-tertiary text-xs mt-0.5">
          {formatDate(version.release_time)}
        </p>
      </div>

      <motion.button
        onClick={(e) => { e.stopPropagation(); onWikiClick(); }}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-primary transition-colors rounded hover:bg-surface-hover flex-shrink-0"
        title="Minecraft Wiki"
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        transition={transitions.spring}
      >
        <ExternalLink className="w-3 h-3" />
        <span className="hidden sm:inline">Wiki</span>
      </motion.button>

      <div className="flex items-center gap-2 flex-shrink-0">
        {installed ? (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={transitions.spring}
          >
            <CheckCircle className="w-4 h-4 text-success" />
          </motion.div>
        ) : downloading ? (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="px-2 py-1 text-[10px] rounded bg-surface-active text-text-secondary flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            下载中
          </motion.button>
        ) : isDeploying ? (
          <motion.div 
            className="w-16 text-[10px] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            部署中 {deployProgress ?? 0}%
          </motion.div>
        ) : onDownload ? (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="px-2 py-1 text-[10px] rounded bg-primary hover:bg-primary-hover text-text-primary transition-colors shadow-sm"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={transitions.spring}
          >
            下载
          </motion.button>
        ) : onDeploy ? (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onDeploy(); }}
            className="px-2 py-1 text-[10px] rounded bg-success hover:bg-success text-text-primary transition-colors shadow-sm"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={transitions.spring}
          >
            部署
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
};

export default VersionListItem;
