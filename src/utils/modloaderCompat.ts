export const isAprilFoolVersion = (versionId: string): boolean => {
  const aprilFoolIds = [
    '20w14infinite',
    '22w13a_or_b',
    '23w13a_or_b',
    '24w14a_or_b',
    '25w14craftmine',
  ];
  return aprilFoolIds.includes(versionId);
};

export const getWikiUrl = (versionId: string): string => {
  const isAprilFool = isAprilFoolVersion(versionId);
  if (isAprilFool) {
    return `https://minecraft.wiki/w/Java_Edition_${versionId}`;
  }
  const isSnapshot = versionId.includes('w') || versionId.includes('-pre') || versionId.includes('-rc');
  if (isSnapshot) {
    return `https://minecraft.wiki/w/Java_Edition_${versionId}`;
  }
  return `https://minecraft.wiki/w/Java_Edition_${versionId}`;
};

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

export const getJavaRequirement = (mcVersion: string): number => {
  if (compareVersions(mcVersion, '1.20.5') >= 0) return 21;
  if (compareVersions(mcVersion, '1.18') >= 0) return 17;
  if (compareVersions(mcVersion, '1.17') >= 0) return 16;
  return 8;
};

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

export const LOADER_MIN_MC_VERSION: Record<string, string> = {
  NeoForge: '1.20.1',
};

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
