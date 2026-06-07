export enum ModLoaderType {
  Vanilla = "Vanilla",
  Fabric = "Fabric",
  Forge = "Forge",
  NeoForge = "NeoForge",
  Quilt = "Quilt",
}

export interface LibraryInfo {
  name: string;
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}

export interface ModLoaderInfo {
  version_id: string;
  mod_loader_type: ModLoaderType;
  minecraft_version: string;
  loader_version: string | null;
  main_class: string;
  libraries: LibraryInfo[];
  client_jar_required: boolean;
}

export interface ModLoaderVersionItem {
  version: string;
  stable: boolean;
  url: string | null;
  sha1: string | null;
}

export interface ModLoaderVersionList {
  mod_loader_type: ModLoaderType;
  minecraft_version: string;
  versions: ModLoaderVersionItem[];
}

export interface FabricVersionDetail {
  id: string;
  inherits_from: string | null;
  jar: string | null;
  main_class: {
    client: string;
  };
  arguments: {
    game: any[];
    jvm: any[];
  };
  libraries: Array<{
    name: string;
    url: string | null;
    sha1: string | null;
    size: number | null;
    path: string | null;
  }>;
}

export const enum ExtendedModLoaderType {
  OptiFine = "OptiFine",
  Quilt = "Quilt",
  FabricApi = "FabricApi",
  QSL = "QSL",
}

export interface OptiFineVersion {
  mcVersion: string;
  patch: string;
  type: string;
  date: string;
  downloadUrl: string;
}

export interface QuiltVersion {
  loader: {
    version: string;
    stable: boolean;
  };
  game: string[];
}

export interface FabricApiVersion {
  loader: string;
  game: string[];
  versions: {
    [version: string]: {
      version: string;
      stable: boolean;
    };
  };
}

export interface CompatibilityCheck {
  loader_type: string;
  mc_version: string;
  is_compatible: boolean;
  reason: string | null;
  available_versions: string[];
  warning: string | null;
}

export interface InstallConfig {
  instance_name: string;
  mc_version: string;
  loaders: LoaderInstallConfig[];
}

export interface LoaderInstallConfig {
  loader_type: string;
  loader_version: string | null;
  install: boolean;
}
