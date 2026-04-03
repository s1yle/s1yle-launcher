import React from 'react';
import { Inbox, Download, FolderOpen, Search, AlertTriangle, CheckCircle } from 'lucide-react';

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

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'default',
  title,
  description,
  action,
  className = '',
}) => {
  const icons = {
    default: <Inbox className="w-16 h-16 text-white/30" strokeWidth={1.5} />,
    download: <Download className="w-16 h-16 text-white/30" strokeWidth={1.5} />,
    folder: <FolderOpen className="w-16 h-16 text-white/30" strokeWidth={1.5} />,
    search: <Search className="w-16 h-16 text-white/30" strokeWidth={1.5} />,
    error: <AlertTriangle className="w-16 h-16 text-red-400" strokeWidth={1.5} />,
    success: <CheckCircle className="w-16 h-16 text-green-400" strokeWidth={1.5} />,
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 opacity-50">
        {icons[icon]}
      </div>
      <h3 className="text-lg font-medium text-white/70 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-white/40 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
