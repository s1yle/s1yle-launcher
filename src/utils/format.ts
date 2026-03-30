export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};

export const getVersionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    release: '正式版',
    snapshot: '快照版',
    old_beta: '旧测试版',
    old_alpha: '旧Alpha版',
  };
  return labels[type] || type;
};

export const getVersionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    release: 'bg-green-500/20 text-green-400 border-green-500/30',
    snapshot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    old_beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    old_alpha: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

export const getVersionTypeBgColor = (type: string): string => {
  const colors: Record<string, string> = {
    release: 'bg-green-500',
    snapshot: 'bg-blue-500',
    old_beta: 'bg-yellow-500',
    old_alpha: 'bg-orange-500',
  };
  return colors[type] || 'bg-gray-500';
};
