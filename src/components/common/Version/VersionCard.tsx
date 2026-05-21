import React from 'react';
import { motion } from 'framer-motion';
import { GameVersion } from '../../../helper/rustInvoke';
import ProgressBar from '../ProgressBar';
import StatusBadge from '../StatusBadge';
import { formatDate } from '../../../utils/format';
import { Loader2, Package } from 'lucide-react';
import { cardHover, transitions } from '../../../utils/animations';

export interface VersionCardProps {
  version: GameVersion;
  installed: boolean;
  downloading: boolean;
  error?: string;
  selected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
  deployProgress: number;
  index?: number;
}

const VersionCard = ({
  version,
  installed,
  downloading,
  error,
  selected,
  onSelect,
  onDownload,
  onDeploy,
  isDeploying,
  deployProgress,
  index = 0,
}: VersionCardProps) => {
  return (
    <motion.div
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      transition={{ ...transitions.normal, delay: index * 0.02 }}
      className={`p-4 bg-surface border rounded-lg transition-all cursor-pointer ${
        selected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-border-hover'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-12 h-12 bg-primary-bg rounded-lg flex items-center justify-center shadow-md"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={transitions.spring}
          >
            <Package className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-text-primary font-medium">{version.id}</h3>
              <StatusBadge type={version.type_} />
              {installed && (
                <motion.span 
                  className="px-2 py-0.5 text-xs rounded bg-success-bg text-success border border-success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={transitions.spring}
                >
                  已安装
                </motion.span>
              )}
            </div>
            <p className="text-text-tertiary text-sm mt-1">
              发布于 {formatDate(version.release_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installed ? (
            <div className="text-right">
              {isDeploying ? (
                <motion.div 
                  className="w-32"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={transitions.fast}
                >
                  <ProgressBar progress={deployProgress} status="active" showPercentage size="sm" />
                </motion.div>
              ) : (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onDeploy(); }}
                  className="px-4 py-2 bg-success hover:bg-success text-text-primary text-sm rounded-lg transition-colors shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={transitions.spring}
                >
                  部署
                </motion.button>
              )}
            </div>
          ) : downloading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-2 bg-surface text-text-primary text-sm rounded-lg"
            >
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-text-primary" />
                下载中
              </span>
            </motion.div>
          ) : error ? (
            <div className="text-right">
              <p className="text-error text-xs mb-1">{error}</p>
              <motion.button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={transitions.spring}
              >
                重试
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm rounded-lg transition-colors shadow-md"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={transitions.spring}
            >
              下载
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VersionCard;
