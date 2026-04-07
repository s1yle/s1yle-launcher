import { GameVersion } from '../helper/rustInvoke';

export type VersionCategory = 'all' | 'release' | 'snapshot' | 'april' | 'old';

const APRIL_FOOL_IDS = [
  '20w14infinite',
  '22w13a_or_b',
  '23w13a_or_b',
  '24w14a_or_b',
  '25w14craftmine',
];

export const isAprilFoolVersion = (versionId: string): boolean => {
  return APRIL_FOOL_IDS.includes(versionId);
};

export const categorizeVersion = (version: GameVersion): VersionCategory => {
  if (version.type_ === 'release') {
    return 'release';
  }
  if (version.type_ === 'snapshot') {
    return 'snapshot';
  }
  if (isAprilFoolVersion(version.id)) {
    return 'april';
  }
  return 'old';
};

export const countVersionsByCategory = (versions: GameVersion[]): Record<VersionCategory, number> => {
  const counts: Record<VersionCategory, number> = {
    all: versions.length,
    release: 0,
    snapshot: 0,
    april: 0,
    old: 0,
  };
  
  for (const version of versions) {
    const category = categorizeVersion(version);
    counts[category]++;
  }
  
  return counts;
};

export const filterVersionsByCategory = (
  versions: GameVersion[],
  filter: VersionCategory
): GameVersion[] => {
  if (filter === 'all') {
    return versions;
  }
  return versions.filter(v => categorizeVersion(v) === filter);
};

export const getVersionCategoryLabel = (category: VersionCategory): string => {
  const labels: Record<VersionCategory, string> = {
    all: '全部',
    release: '正式版',
    snapshot: '快照',
    april: '愚人节',
    old: '远古版',
  };
  return labels[category];
};