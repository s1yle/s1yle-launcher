/** 愚人节版本 ID 集合（单一事实源） */
export const APRIL_FOOL_IDS = new Set([
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
 * 判断是否为愚人节版本
 * @param versionId - 版本 ID
 * @returns 是否为愚人节版本
 */
export const isAprilFoolVersion = (versionId: string): boolean => APRIL_FOOL_IDS.has(versionId);

/**
 * 获取 Minecraft Wiki 页面 URL
 * @param versionId - 版本 ID
 * @returns Wiki URL
 */
export const getWikiUrl = (versionId: string): string => {
  return `https://minecraft.wiki/w/Java_Edition_${versionId}`;
};

/**
 * 比较两个 Minecraft 版本号
 * @param a - 版本号 A
 * @param b - 版本号 B
 * @returns 负数表示 a < b，正数表示 a > b，0 表示相等
 */
export const compareVersions = (a: string, b: string): number => {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
};

/**
 * 获取指定 Minecraft 版本所需的 Java 版本
 * @param mcVersion - Minecraft 版本号
 * @returns 所需的 Java 主版本号
 */
export const getJavaRequirement = (mcVersion: string): number => {
  if (compareVersions(mcVersion, '1.20.5') >= 0) return 21;
  if (compareVersions(mcVersion, '1.18') >= 0) return 17;
  if (compareVersions(mcVersion, '1.17') >= 0) return 16;
  return 8;
};

/**
 * 模组加载器兼容性映射表
 * - compatible: 可共存的加载器列表
 * - incompatible: 互斥的加载器列表
 */
export const LOADER_COMPATIBILITY: Record<string, { compatible: string[]; incompatible: string[] }> = {
  Forge: {
    compatible: ['OptiFine'],
    incompatible: ['NeoForge', 'Fabric', 'Quilt'],
  },
  NeoForge: {
    compatible: ['OptiFine'],
    incompatible: ['Forge', 'Fabric', 'Quilt'],
  },
  Fabric: {
    compatible: ['OptiFine', 'Quilt'],
    incompatible: ['Forge', 'NeoForge'],
  },
  Quilt: {
    compatible: ['Fabric', 'OptiFine'],
    incompatible: ['Forge', 'NeoForge'],
  },
  OptiFine: {
    compatible: ['Forge', 'Fabric', 'NeoForge'],
    incompatible: [],
  },
  Vanilla: {
    compatible: [],
    incompatible: [],
  },
};

/**
 * 加载器的最低 Minecraft 版本要求
 */
export const LOADER_MIN_MC_VERSION: Record<string, string> = {
  NeoForge: '1.20.1',
};

/**
 * 检查目标加载器与已安装加载器的兼容性
 * @param mcVersion - Minecraft 版本
 * @param targetLoader - 目标加载器名称
 * @param installedLoaders - 已安装的加载器列表
 * @returns 兼容性检查结果，包含 compatible 标识和可选的 reason/warning
 */
export const checkLoaderCompatibility = (
  mcVersion: string,
  targetLoader: string,
  installedLoaders: string[]
): { compatible: boolean; reason?: string; warning?: string } => {
  if (isAprilFoolVersion(mcVersion)) {
    return { compatible: false, reason: '愚人节版本不支持任何模组加载器' };
  }

  if (LOADER_MIN_MC_VERSION[targetLoader]) {
    const minVersion = LOADER_MIN_MC_VERSION[targetLoader];
    if (compareVersions(mcVersion, minVersion) < 0) {
      return { compatible: false, reason: `${targetLoader} 仅支持 ${minVersion} 及以上版本` };
    }
  }

  for (const installed of installedLoaders) {
    if (installed === targetLoader) continue;
    const installedCompat = LOADER_COMPATIBILITY[installed];
    if (installedCompat && installedCompat.incompatible.includes(targetLoader)) {
      return { compatible: false, reason: `${targetLoader} 与已安装的 ${installed} 互斥` };
    }
  }

  return { compatible: true };
};
