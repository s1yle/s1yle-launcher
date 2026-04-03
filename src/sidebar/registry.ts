import { type SidebarMenuItem } from '../router/config';

export interface SidebarConfig {
  match: (path: string) => boolean;
  items: () => SidebarMenuItem[];
  onItemClick: (item: SidebarMenuItem) => void;
  groupTitle: string;
  groupTitleI18nKey: string;
  isActive?: (id: string) => boolean;
  isParentActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
}

const registry: SidebarConfig[] = [];

export function registerSidebar(config: SidebarConfig) {
  registry.push(config);
}

export function findMatchingSidebar(path: string): SidebarConfig | null {
  return registry.find(config => config.match(path)) || null;
}
