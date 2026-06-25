import { motion } from 'framer-motion';
import { Inbox, Download, FolderOpen, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { fadeInUp, transitions } from '../../utils/animations';

/** 空状态占位组件 Props */
export interface EmptyStateProps {
  icon?: 'default' | 'download' | 'folder' | 'search' | 'error' | 'success';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/** 空状态占位组件，显示图标、标题、描述和可选的按钮操作 */
const EmptyState = ({
  icon = 'default',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  const icons = {
    default: <Inbox className="w-16 h-16 text-text-tertiary" strokeWidth={1.5} />,
    download: <Download className="w-16 h-16 text-text-tertiary" strokeWidth={1.5} />,
    folder: <FolderOpen className="w-16 h-16 text-text-tertiary" strokeWidth={1.5} />,
    search: <Search className="w-16 h-16 text-text-tertiary" strokeWidth={1.5} />,
    error: <AlertTriangle className="w-16 h-16 text-red-400" strokeWidth={1.5} />,
    success: <CheckCircle className="w-16 h-16 text-green-400" strokeWidth={1.5} />,
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitions.normal}
    >
      <motion.div
        className="mb-4 opacity-50"
        animate={{
          y: [0, -10, 0],
          opacity: [0.5, 0.7, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {icons[icon]}
      </motion.div>
      <motion.h3
        className="text-lg font-medium text-text-secondary mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...transitions.normal }}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          className="text-sm text-text-tertiary mb-4 max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...transitions.normal }}
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm font-medium rounded-lg transition-colors shadow-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...transitions.spring }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
