import { ModLoaderType } from '@/api/types/modloader';

const BLOCK_ICON_BASE = '/assets/icons/blocks';

// FIXME: 尚缺素材
// - Fabric.png（布料 Logo，优先）— 现用 loom 兜底
// - NeoForge.png（狐狸 Logo，优先）— 现用 blast_furnace 兜底
// - ChorusFruit.png（Quilt）— 现用 chorus_flower
// - 备用：GrassPath、RedstoneBlock、Egg

export const BLOCK_ICONS = {
  anvil: `${BLOCK_ICON_BASE}/anvil.png`,
  blastFurnace: `${BLOCK_ICON_BASE}/blast_furnace.png`,
  chainCommandBlock: `${BLOCK_ICON_BASE}/chain_command_block.png`,
  chippedAnvil: `${BLOCK_ICON_BASE}/chipped_anvil.png`,
  chorusFlower: `${BLOCK_ICON_BASE}/chorus_flower.png`,
  cobblestone: `${BLOCK_ICON_BASE}/cobblestone.png`,
  commandBlock: `${BLOCK_ICON_BASE}/command_block.png`,
  damagedAnvil: `${BLOCK_ICON_BASE}/damaged_anvil.png`,
  dragonEgg: `${BLOCK_ICON_BASE}/dragon_egg.png`,
  furnace: `${BLOCK_ICON_BASE}/furnace.png`,
  glowstone: `${BLOCK_ICON_BASE}/glowstone.png`,
  goldBlock: `${BLOCK_ICON_BASE}/gold_block.png`,
  grassBlock: `${BLOCK_ICON_BASE}/grass_block.png`,
  loom: `${BLOCK_ICON_BASE}/loom.png`,
  redstoneLamp: `${BLOCK_ICON_BASE}/redstone_lamp.png`,
  redstoneLampOn: `${BLOCK_ICON_BASE}/redstone_lamp_on.png`,
  redstoneTorch: `${BLOCK_ICON_BASE}/redstone_torch.png`,
  redstoneTorchOff: `${BLOCK_ICON_BASE}/redstone_torch_off.png`,
  repeatingCommandBlock: `${BLOCK_ICON_BASE}/repeating_command_block.png`,
} as const;

const LOADER_BLOCK_ICONS: Record<ModLoaderType, string> = {
  [ModLoaderType.Vanilla]: BLOCK_ICONS.grassBlock,
  [ModLoaderType.Fabric]: BLOCK_ICONS.loom,
  [ModLoaderType.Forge]: BLOCK_ICONS.furnace,
  [ModLoaderType.NeoForge]: BLOCK_ICONS.blastFurnace,
  [ModLoaderType.Quilt]: BLOCK_ICONS.chorusFlower,
  [ModLoaderType.OptiFine]: BLOCK_ICONS.glowstone,
};

export function getLoaderBlockIcon(loaderType: ModLoaderType): string {
  return LOADER_BLOCK_ICONS[loaderType] ?? BLOCK_ICONS.cobblestone;
}

export const UI_BLOCK_ICONS = {
  home: BLOCK_ICONS.grassBlock,
  game: BLOCK_ICONS.cobblestone,
  download: BLOCK_ICONS.goldBlock,
  account: BLOCK_ICONS.dragonEgg,
  settings: BLOCK_ICONS.anvil,
  world: BLOCK_ICONS.grassBlock,
} as const;

const VERSION_TYPE_ICONS: Record<string, string> = {
  release: BLOCK_ICONS.grassBlock,
  snapshot: BLOCK_ICONS.commandBlock,
  old_beta: BLOCK_ICONS.cobblestone,
  old_alpha: BLOCK_ICONS.cobblestone,
};

export function getVersionTypeBlockIcon(type: string): string {
  return VERSION_TYPE_ICONS[type] ?? BLOCK_ICONS.cobblestone;
}