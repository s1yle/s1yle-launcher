/**
 * 格式化文件大小（字节 → 人类可读）
 * @param bytes - 字节数
 * @returns 格式化后的字符串，如 "1.5 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期字符串
 * @param dateStr - 日期字符串
 * @returns 本地化日期格式（zh-CN）
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};

/**
 * 获取版本类型的显示标签
 * @param type - 版本类型（release/snapshot/old_beta/old_alpha）
 * @returns 中文标签
 */
export const getVersionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    release: '正式版',
    snapshot: '快照版',
    old_beta: '旧测试版',
    old_alpha: '旧Alpha版',
  };
  return labels[type] || type;
};

/**
 * 获取版本类型的 Tailwind 样式类名
 * @param type - 版本类型
 * @returns 样式类名字符串
 */
export const getVersionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    release: 'bg-green-500/20 text-green-400 border-green-500/30',
    snapshot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    old_beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    old_alpha: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

/**
 * 获取版本类型的背景色类名
 * @param type - 版本类型
 * @returns 背景色类名
 */
export const getVersionTypeBgColor = (type: string): string => {
  const colors: Record<string, string> = {
    release: 'bg-green-500',
    snapshot: 'bg-blue-500',
    old_beta: 'bg-yellow-500',
    old_alpha: 'bg-orange-500',
  };
  return colors[type] || 'bg-gray-500';
};

/**
 * 根据版本 ID 推断版本类型
 * @param versionId - 版本 ID
 * @returns 推断出的版本类型中文名称
 */
export const inferVersionType = (versionId: string): string => {
  const version = versionId.toLowerCase();
  
  if (version.includes('infinite') || 
      version.includes('_or_b') || 
      version.includes('20w14') ||
      version.includes('23w13') ||
      version.includes('3d shareware') ||
      version.includes('combat') ||
      version.includes('valentines') ||
      version.includes('love and hugs')) {
    return '愚人节版';
  }
  
  if (version.includes('-pre') || version.includes('-rc')) {
    return '预发布版';
  }
  
  if (version.match(/\d{2}w\d{2}[a-z]/)) {
    return '快照版';
  }
  
  if (version.match(/^1\.\d+(\.\d+)?$/)) {
    return '正式版';
  }
  
  if (version.includes('alpha') || version.includes('a1.') || version.includes('a0.')) {
    return '旧Alpha版';
  }
  
  if (version.includes('beta') || version.includes('b1.')) {
    return '旧测试版';
  }
  
  return '正式版';
};
