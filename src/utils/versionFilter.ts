import { GameVersion } from '../helper/rustInvoke';

/**
 * 版本分类类型
 * - all: 全部
 * - release: 正式版
 * - snapshot: 快照版
 * - april: 愚人节版
 * - old: 旧版本
 */
export type VersionCategory = 'all' | 'release' | 'snapshot' | 'april' | 'old';

const APRIL_FOOL_IDS = new Set([
  '2.0',
  '15w14a',
  '1.RV-Pre1',
  '3D Shareware v1.34',
  '20w14infinite',
  '20w14∞',
  '22w13a_or_b',
  '23w13a_or_b',
  '24w14a_or_b',
  '24w14potato',
  '25w14craftmine',
]);

/**
 * 对游戏版本进行分类
 * @param version - 游戏版本信息
 * @returns 分类结果
 */
export const categorizeVersion = (version: GameVersion): VersionCategory => {
  const { id, type_ } = version;

  switch (type_) {
    case 'release':
      return 'release';

    case 'snapshot':
      if (APRIL_FOOL_IDS.has(id)) {
        return 'april';
      }
      return 'snapshot';

    case 'old_beta':
    case 'old_alpha':
      return 'old';

    default:
      break;
  }

  if (APRIL_FOOL_IDS.has(id)) {
    return 'april';
  }

  const oldPrefixes = ['rd-', 'c', 'in-', 'inf-'];
  const isOldPrefix = oldPrefixes.some(prefix => id.startsWith(prefix));
  if (isOldPrefix) {
    return 'old';
  }

  if (/^\d{2}w\d{2}[a-z]$/.test(id) || id.includes('-snapshot-')) {
    return 'snapshot';
  }

  if (/^[ab]\d/.test(id)) {
    return 'old';
  }

  if (/^\d+(\.\d+)*$/.test(id)) {
    return 'release';
  }

  return 'snapshot';
};

/**
 * 按分类统计版本数量
 * @param versions - 版本列表
 * @returns 各分类的计数
 */
export const countVersionsByCategory = (versions: GameVersion[]): Record<VersionCategory, number> => {
  const counts: Record<VersionCategory, number> = {
    all: 0,
    release: 0,
    snapshot: 0,
    april: 0,
    old: 0,
  };

  if (!versions || versions.length === 0) {
    return counts;
  }

  counts.all = versions.length;

  for (const version of versions) {
    const category = categorizeVersion(version);
    counts[category]++;
  }

  return counts;
};

/**
 * 按分类筛选版本列表
 * @param versions - 版本列表
 * @param filter - 筛选分类
 * @returns 筛选后的版本列表
 */
export const filterVersionsByCategory = (
  versions: GameVersion[],
  filter: VersionCategory
): GameVersion[] => {
  if (!versions) return [];
  if (filter === 'all') return versions;

  return versions.filter(v => categorizeVersion(v) === filter);
};

/**
 * 搜索版本（按 ID 和名称模糊匹配）
 * @param versions - 版本列表
 * @param query - 搜索关键词
 * @returns 匹配的版本列表
 */
export const searchVersions = (
  versions: GameVersion[],
  query: string
): GameVersion[] => {
  if (!query.trim() || !versions) return versions;

  const lowerQuery = query.toLowerCase().trim();

  return versions.filter(v =>
    v.id.toLowerCase().includes(lowerQuery) ||
    (v.name && v.name.toLowerCase().includes(lowerQuery))
  );
};

/**
 * 调试工具：打印版本的 type_ 字段分布和分类分布
 * @param versions - 版本列表
 */
export const debugVersionTypes = (versions: GameVersion[]): void => {
  const typeCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const v of versions) {
    const rawType = v.type_ || '(empty)';
    typeCounts.set(rawType, (typeCounts.get(rawType) || 0) + 1);

    const category = categorizeVersion(v);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  console.log('=== Raw type_ field distribution ===');
  console.log(Object.fromEntries(typeCounts));
  console.log('=== Categorized distribution ===');
  console.log(Object.fromEntries(categoryCounts));
};

export default {
  categorizeVersion,
  countVersionsByCategory,
  filterVersionsByCategory,
  searchVersions,
  debugVersionTypes,
};
